import { prisma } from "@/lib/db";

/**
 * Builds a compact, real-data snapshot of a school for the AI School
 * Assistant persona to answer from — the alternative to an LLM guessing at
 * "how much is outstanding" or "which class has the lowest average" is to
 * hand it the actual numbers as context on every request.
 */
export async function buildSchoolSnapshot(schoolId: string): Promise<string> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [invoiceTotals, classes, students, currentTerm, attendanceRecords] = await Promise.all([
    prisma.invoice.aggregate({ where: { schoolId }, _sum: { amountDue: true, amountPaid: true } }),
    prisma.class.findMany({ where: { schoolId }, select: { id: true, name: true } }),
    prisma.student.findMany({ where: { schoolId }, select: { id: true, firstName: true, lastName: true, classId: true, createdAt: true } }),
    prisma.term.findFirst({ where: { session: { schoolId } }, orderBy: [{ isCurrent: "desc" }, { startDate: "desc" }] }),
    prisma.attendance.findMany({
      where: { student: { schoolId }, date: { gte: thirtyDaysAgo } },
      select: { studentId: true, status: true },
    }),
  ]);

  const totalDue = invoiceTotals._sum.amountDue ?? 0;
  const totalPaid = invoiceTotals._sum.amountPaid ?? 0;
  const outstanding = Math.max(0, totalDue - totalPaid);

  // Per-student attendance rate over the last 30 days.
  const byStudent = new Map<string, { present: number; total: number }>();
  for (const a of attendanceRecords) {
    const bucket = byStudent.get(a.studentId) ?? { present: 0, total: 0 };
    bucket.total += 1;
    if (a.status === "PRESENT") bucket.present += 1;
    byStudent.set(a.studentId, bucket);
  }
  const poorAttendance = students
    .filter((s) => {
      const b = byStudent.get(s.id);
      return b && b.total >= 3 && b.present / b.total < 0.6;
    })
    .slice(0, 10)
    .map((s) => `${s.firstName} ${s.lastName}`);

  let classAveragesText = "Not available (no scores recorded for the current term yet).";
  if (currentTerm) {
    const components = await prisma.gradingComponent.findMany({ where: { schoolId }, select: { maxScore: true } });
    const maxTotal = components.reduce((sum, c) => sum + c.maxScore, 0) || 1;
    const scores = await prisma.score.findMany({ where: { schoolId, termId: currentTerm.id }, select: { studentId: true, score: true } });
    const totalsByStudent = new Map<string, number>();
    for (const s of scores) totalsByStudent.set(s.studentId, (totalsByStudent.get(s.studentId) ?? 0) + s.score);
    const studentsByClass = new Map<string, string[]>();
    for (const st of students) {
      if (!st.classId) continue;
      studentsByClass.set(st.classId, [...(studentsByClass.get(st.classId) ?? []), st.id]);
    }
    const averages = classes
      .map((c) => {
        const ids = studentsByClass.get(c.id) ?? [];
        const withScores = ids.filter((id) => totalsByStudent.has(id));
        if (withScores.length === 0) return null;
        const avg = Math.round((withScores.reduce((sum, id) => sum + (totalsByStudent.get(id) ?? 0), 0) / withScores.length / maxTotal) * 1000) / 10;
        return { name: c.name, avg };
      })
      .filter((v): v is { name: string; avg: number } => v !== null)
      .sort((a, b) => b.avg - a.avg);
    if (averages.length > 0) {
      classAveragesText = averages.map((c) => `${c.name}: ${c.avg}%`).join("; ");
    }
  }

  const newThisMonth = students.filter((s) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return s.createdAt >= monthAgo;
  }).length;

  return [
    `SCHOOL DATA SNAPSHOT (as of ${new Date().toLocaleDateString("en-NG")}):`,
    `- Total students: ${students.length} (${newThisMonth} enrolled in the last 30 days).`,
    `- Fees: total invoiced ₦${totalDue.toLocaleString("en-NG")}, collected ₦${totalPaid.toLocaleString("en-NG")}, outstanding ₦${outstanding.toLocaleString("en-NG")}.`,
    `- Current term: ${currentTerm?.name ?? "none set"}.`,
    `- Class averages this term (highest to lowest): ${classAveragesText}`,
    `- Students with poor attendance in the last 30 days (present <60% of recorded days): ${
      poorAttendance.length > 0 ? poorAttendance.join(", ") : "none flagged"
    }.`,
  ].join("\n");
}
