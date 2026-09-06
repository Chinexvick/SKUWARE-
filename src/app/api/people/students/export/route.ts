import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { toCsv } from "@/lib/csv";
import { ADMIN_ROLES } from "@/lib/auth/api-guard";

/**
 * CSV export of student records. Management can export one class or every
 * student at the school in a single, richly-detailed file (admission info,
 * class, guardians, attendance rate, fee balance); a teacher can only
 * export a class they actually teach.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const isAdmin = (ADMIN_ROLES as string[]).includes(user.role) || user.role === "SUPER_ADMIN";
  const isTeacher = user.role === "TEACHER";
  if (!isAdmin && !isTeacher) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const classId = req.nextUrl.searchParams.get("classId");
  const schoolId = user.schoolId;

  if (isTeacher) {
    if (!classId || classId === "all") {
      return NextResponse.json({ error: "Teachers must export one class at a time." }, { status: 400 });
    }
    const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
    const teachesClass = staffProfile
      ? await prisma.teacherSubjectAssignment.findFirst({ where: { teacherId: staffProfile.id, classId } })
      : null;
    if (!teachesClass) return NextResponse.json({ error: "You don't teach this class." }, { status: 403 });
  }

  const students = await prisma.student.findMany({
    where: { schoolId, ...(classId && classId !== "all" ? { classId } : {}) },
    include: {
      class: true,
      arm: true,
      parentLinks: { include: { parent: { include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } } } } },
      invoices: true,
      attendance: true,
    },
    orderBy: [{ class: { name: "asc" } }, { lastName: "asc" }],
  });

  const headers = [
    "Admission No",
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Class",
    "Arm",
    "Status",
    "Guardian Name(s)",
    "Guardian Phone(s)",
    "Guardian Email(s)",
    "Attendance Rate (%)",
    "Fees Outstanding (NGN)",
  ];

  const rows = students.map((s) => {
    const guardians = s.parentLinks.map((l) => l.parent.user);
    const totalDue = s.invoices.reduce((sum, i) => sum + i.amountDue, 0);
    const totalPaid = s.invoices.reduce((sum, i) => sum + i.amountPaid, 0);
    const outstanding = Math.max(0, totalDue - totalPaid);
    const present = s.attendance.filter((a) => a.status === "PRESENT").length;
    const attendanceRate = s.attendance.length > 0 ? Math.round((present / s.attendance.length) * 1000) / 10 : "";

    return [
      s.admissionNo,
      s.firstName,
      s.lastName,
      s.gender ?? "",
      s.dateOfBirth ? s.dateOfBirth.toISOString().slice(0, 10) : "",
      s.class?.name ?? "",
      s.arm?.name ?? "",
      s.status,
      guardians.map((g) => `${g.firstName} ${g.lastName}`).join("; "),
      guardians.map((g) => g.phone ?? "").filter(Boolean).join("; "),
      guardians.map((g) => g.email).join("; "),
      attendanceRate,
      outstanding,
    ];
  });

  const csv = toCsv(headers, rows);
  const filename = classId && classId !== "all" ? `students-${classId}.csv` : "students-all.csv";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
