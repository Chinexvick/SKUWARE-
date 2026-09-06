import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { assignmentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  const { user, response } = await requireApiUser([...ADMIN_AND_STAFF_ROLES, "TEACHER"]);
  if (!user) return response!;

  const termId = req.nextUrl.searchParams.get("termId") ?? undefined;

  let teacherId: string | undefined;
  if (user.role === "TEACHER") {
    const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
    if (!staffProfile) return NextResponse.json({ assignments: [] });
    teacherId = staffProfile.id;
  }

  const assignments = await prisma.teacherSubjectAssignment.findMany({
    where: { schoolId: user.schoolId!, ...(termId ? { termId } : {}), ...(teacherId ? { teacherId } : {}) },
    include: {
      subject: true,
      class: true,
      arm: true,
      term: true,
      teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const schoolId = user.schoolId!;

  const body = await req.json().catch(() => null);
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { teacherId, subjectId, classId, armId, termId } = parsed.data;

  const [teacher, subject, klass, term] = await Promise.all([
    prisma.staffProfile.findFirst({ where: { id: teacherId, schoolId } }),
    prisma.subject.findFirst({ where: { id: subjectId, schoolId } }),
    prisma.class.findFirst({ where: { id: classId, schoolId } }),
    prisma.term.findFirst({ where: { id: termId, session: { schoolId } } }),
  ]);
  if (!teacher) return NextResponse.json({ error: "Teacher not found." }, { status: 404 });
  if (!subject) return NextResponse.json({ error: "Subject not found." }, { status: 404 });
  if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });
  if (!term) return NextResponse.json({ error: "Term not found." }, { status: 404 });

  if (armId) {
    const arm = await prisma.arm.findFirst({ where: { id: armId, classId } });
    if (!arm) return NextResponse.json({ error: "Arm not found for the given class." }, { status: 404 });
  }

  const duplicate = await prisma.teacherSubjectAssignment.findFirst({
    where: { teacherId, subjectId, classId, armId: armId ?? null, termId },
  });
  if (duplicate) {
    return NextResponse.json({ error: "This teacher is already assigned to this subject/class/term." }, { status: 409 });
  }

  const assignment = await prisma.teacherSubjectAssignment.create({
    data: { schoolId, teacherId, subjectId, classId, armId, termId },
    include: { subject: true, class: true, arm: true, term: true },
  });

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "TeacherSubjectAssignment",
    targetId: assignment.id,
  });

  return NextResponse.json({ assignment }, { status: 201 });
}
