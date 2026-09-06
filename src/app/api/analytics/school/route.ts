import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const schoolId = user.schoolId!;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  const [
    attendanceRecords,
    invoiceTotals,
    components,
    classes,
    students,
    activeTerm,
  ] = await Promise.all([
    prisma.attendance.findMany({
      where: { student: { schoolId }, date: { gte: thirtyDaysAgo } },
      select: { status: true },
    }),
    prisma.invoice.aggregate({
      where: { schoolId },
      _sum: { amountDue: true, amountPaid: true },
    }),
    prisma.gradingComponent.findMany({ where: { schoolId }, select: { maxScore: true } }),
    prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true } }),
    prisma.student.findMany({ where: { schoolId }, select: { id: true, classId: true, createdAt: true } }),
    prisma.term.findFirst({ where: { session: { schoolId } }, orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] }),
  ]);

  // Attendance: overall rate + trend over the last 30 days.
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 1000) / 10 : null;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;

  // Finance: collection rate.
  const totalDue = invoiceTotals._sum.amountDue ?? 0;
  const totalPaid = invoiceTotals._sum.amountPaid ?? 0;
  const collectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 1000) / 10 : null;

  // Academics: average percentage per class, for the most recent term.
  const maxTotal = components.reduce((sum, c) => sum + c.maxScore, 0) || 1;
  let classAverages: { classId: string; className: string; average: number; studentCount: number }[] = [];
  if (activeTerm) {
    const scores = await prisma.score.findMany({
      where: { schoolId, termId: activeTerm.id },
      select: { studentId: true, score: true },
    });
    const totalsByStudent = new Map<string, number>();
    for (const s of scores) {
      totalsByStudent.set(s.studentId, (totalsByStudent.get(s.studentId) ?? 0) + s.score);
    }
    const studentsByClass = new Map<string, string[]>();
    for (const st of students) {
      if (!st.classId) continue;
      const list = studentsByClass.get(st.classId) ?? [];
      list.push(st.id);
      studentsByClass.set(st.classId, list);
    }
    classAverages = classes
      .map((c) => {
        const ids = studentsByClass.get(c.id) ?? [];
        const withScores = ids.filter((id) => totalsByStudent.has(id));
        const average =
          withScores.length > 0
            ? Math.round(
                (withScores.reduce((sum, id) => sum + (totalsByStudent.get(id) ?? 0), 0) / withScores.length / maxTotal) * 1000,
              ) / 10
            : 0;
        return { classId: c.id, className: c.name, average, studentCount: ids.length };
      })
      .filter((c) => c.studentCount > 0);
  }

  // Enrollment trend: new students per month, last 6 months.
  const monthBuckets: { label: string; count: number }[] = [];
  for (let i = 0; i < 6; i++) {
    const monthStart = new Date(sixMonthsAgo);
    monthStart.setMonth(monthStart.getMonth() + i);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    const count = students.filter((s) => s.createdAt >= monthStart && s.createdAt < monthEnd).length;
    monthBuckets.push({ label: monthStart.toLocaleDateString("en-US", { month: "short" }), count });
  }

  return NextResponse.json({
    attendance: { rate: attendanceRate, present: presentCount, late: lateCount, absent: absentCount, sampleSize: attendanceRecords.length },
    finance: { totalDue, totalPaid, outstanding: Math.max(0, totalDue - totalPaid), collectionRate },
    academics: { classAverages, term: activeTerm ? { id: activeTerm.id, name: activeTerm.name } : null },
    enrollment: { trend: monthBuckets, total: students.length },
  });
}
