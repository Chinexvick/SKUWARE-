import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { bulkScoreSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

async function loadAssignmentScoped(assignmentId: string, schoolId: string) {
  return prisma.teacherSubjectAssignment.findFirst({
    where: { id: assignmentId, schoolId },
    include: { class: true, arm: true, subject: true, term: true },
  });
}

async function assertCanAccessAssignment(
  user: { id: string; role: string; schoolId: string | null },
  assignment: { teacherId: string } | null,
) {
  if (!assignment) return false;
  if (ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) return true;
  if (user.role === "TEACHER") {
    const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
    return staffProfile?.id === assignment.teacherId;
  }
  return false;
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER"]);
  if (!user) return response!;

  const assignmentId = req.nextUrl.searchParams.get("assignmentId");
  if (!assignmentId) return NextResponse.json({ error: "assignmentId is required." }, { status: 400 });

  const assignment = await loadAssignmentScoped(assignmentId, user.schoolId!);
  if (!(await assertCanAccessAssignment(user, assignment))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [students, components, scores] = await Promise.all([
    prisma.student.findMany({
      where: { classId: assignment!.classId, ...(assignment!.armId ? { armId: assignment!.armId } : {}) },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.gradingComponent.findMany({ where: { schoolId: user.schoolId! }, orderBy: { order: "asc" } }),
    prisma.score.findMany({ where: { assignmentId } }),
  ]);

  return NextResponse.json({ assignment, students, components, scores });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER"]);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = bulkScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { assignmentId, entries } = parsed.data;

  const assignment = await loadAssignmentScoped(assignmentId, user.schoolId!);
  if (!(await assertCanAccessAssignment(user, assignment))) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const [validStudentIds, validComponents] = await Promise.all([
    prisma.student.findMany({
      where: { classId: assignment!.classId, ...(assignment!.armId ? { armId: assignment!.armId } : {}) },
      select: { id: true },
    }),
    prisma.gradingComponent.findMany({ where: { schoolId: user.schoolId! }, select: { id: true, maxScore: true } }),
  ]);
  const studentIdSet = new Set(validStudentIds.map((s) => s.id));
  const componentMap = new Map(validComponents.map((c) => [c.id, c.maxScore]));

  for (const entry of entries) {
    if (!studentIdSet.has(entry.studentId)) {
      return NextResponse.json({ error: "One or more students are not in this class." }, { status: 400 });
    }
    const maxScore = componentMap.get(entry.componentId);
    if (maxScore === undefined) {
      return NextResponse.json({ error: "Unknown grading component." }, { status: 400 });
    }
    if (entry.score > maxScore) {
      return NextResponse.json({ error: `Score cannot exceed ${maxScore} for this component.` }, { status: 400 });
    }
  }

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.score.upsert({
        where: {
          studentId_subjectId_termId_componentId: {
            studentId: entry.studentId,
            subjectId: assignment!.subjectId,
            termId: assignment!.termId,
            componentId: entry.componentId,
          },
        },
        create: {
          schoolId: user.schoolId!,
          studentId: entry.studentId,
          subjectId: assignment!.subjectId,
          termId: assignment!.termId,
          componentId: entry.componentId,
          assignmentId,
          score: entry.score,
          recordedById: user.id,
        },
        update: { score: entry.score, recordedById: user.id, assignmentId },
      }),
    ),
  );

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_UPDATED",
    targetType: "Score",
    targetId: assignmentId,
    metadata: { count: entries.length },
  });

  return NextResponse.json({ message: "Scores saved." });
}
