import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { markAttendanceSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import { getCurrentUser } from "@/lib/auth/current-user";

const STAFF_ROLES: UserRole[] = [...ADMIN_ROLES, "TEACHER"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const classId = req.nextUrl.searchParams.get("classId");
  const date = req.nextUrl.searchParams.get("date");
  const studentId = req.nextUrl.searchParams.get("studentId");
  const from = req.nextUrl.searchParams.get("from");
  const to = req.nextUrl.searchParams.get("to");

  // Register view: a class + a single date, for admin/teacher marking or review.
  if (classId && date) {
    if (!STAFF_ROLES.includes(user.role)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const klass = await prisma.class.findFirst({ where: { id: classId, schoolId: user.schoolId! } });
    if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

    const dayStart = new Date(date);
    const students = await prisma.student.findMany({ where: { classId }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
    const records = await prisma.attendance.findMany({ where: { studentId: { in: students.map((s) => s.id) }, date: dayStart } });
    return NextResponse.json({ students, records });
  }

  // History view: one student across a date range, for admin/teacher/parent(own child)/student(self).
  if (studentId) {
    const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId! } });
    if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

    if (STAFF_ROLES.includes(user.role)) {
      // allowed
    } else if (user.role === "PARENT") {
      const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
      const linked = parentProfile
        ? await prisma.studentParentLink.findFirst({ where: { parentId: parentProfile.id, studentId } })
        : null;
      if (!linked) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    } else if (user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
      if (profile?.student?.id !== studentId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    } else {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const records = await prisma.attendance.findMany({
      where: {
        studentId,
        ...(from ? { date: { gte: new Date(from) } } : {}),
        ...(to ? { date: { lte: new Date(to) } } : {}),
      },
      orderBy: { date: "desc" },
      take: 200,
    });
    return NextResponse.json({ records });
  }

  return NextResponse.json({ error: "classId+date or studentId is required." }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(STAFF_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = markAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { classId, armId, date, entries } = parsed.data;
  const schoolId = user.schoolId!;

  const klass = await prisma.class.findFirst({ where: { id: classId, schoolId } });
  if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });

  const validStudents = await prisma.student.findMany({
    where: { classId, ...(armId ? { armId } : {}) },
    select: { id: true },
  });
  const validIds = new Set(validStudents.map((s) => s.id));
  for (const entry of entries) {
    if (!validIds.has(entry.studentId)) {
      return NextResponse.json({ error: "One or more students are not in this class." }, { status: 400 });
    }
  }

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: entry.studentId, date } },
        create: { studentId: entry.studentId, date, status: entry.status, recordedBy: user.id },
        update: { status: entry.status, recordedBy: user.id },
      }),
    ),
  );

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_UPDATED",
    targetType: "Attendance",
    metadata: { classId, date: date.toISOString(), count: entries.length },
  });

  return NextResponse.json({ message: "Attendance saved." });
}
