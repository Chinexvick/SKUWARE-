import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { subjectCommentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER"]);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = subjectCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { assignmentId, studentId, comment } = parsed.data;

  const assignment = await prisma.teacherSubjectAssignment.findFirst({
    where: { id: assignmentId, schoolId: user.schoolId! },
  });
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  if (!ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
    if (staffProfile?.id !== assignment.teacherId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const student = await prisma.student.findFirst({ where: { id: studentId, classId: assignment.classId } });
  if (!student) return NextResponse.json({ error: "Student not found in this class." }, { status: 404 });

  const record = await prisma.subjectComment.upsert({
    where: { studentId_subjectId_termId: { studentId, subjectId: assignment.subjectId, termId: assignment.termId } },
    create: {
      schoolId: user.schoolId!,
      studentId,
      subjectId: assignment.subjectId,
      termId: assignment.termId,
      assignmentId,
      comment,
      authoredById: user.id,
    },
    update: { comment, authoredById: user.id, assignmentId },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_UPDATED",
    targetType: "SubjectComment",
    targetId: record.id,
  });

  return NextResponse.json({ comment: record });
}
