import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { homeworkSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import { notifyUsers } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (user.role === "TEACHER") {
    const assignments = await prisma.assignment.findMany({
      where: { createdById: user.id },
      include: { subject: true, class: true, arm: true, _count: { select: { submissions: true } } },
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  if (user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
    if (!profile?.student) return NextResponse.json({ assignments: [] });
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: profile.student.classId ?? "__none__",
        OR: [{ armId: null }, { armId: profile.student.armId }],
      },
      include: { subject: true, submissions: { where: { studentId: profile.student.id } } },
      orderBy: { dueDate: "desc" },
    });
    return NextResponse.json({ assignments });
  }

  const assignments = await prisma.assignment.findMany({
    where: { schoolId: user.schoolId! },
    include: { subject: true, class: true, arm: true, createdBy: { select: { firstName: true, lastName: true } } },
    orderBy: { dueDate: "desc" },
    take: 100,
  });
  return NextResponse.json({ assignments });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "TEACHER") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = homeworkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { title, instructions, subjectId, classId, armId, termId, dueDate } = parsed.data;
  const schoolId = user.schoolId!;

  const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });
  const hasAssignment = staffProfile
    ? await prisma.teacherSubjectAssignment.findFirst({ where: { teacherId: staffProfile.id, subjectId, classId, termId } })
    : null;
  if (!hasAssignment) {
    return NextResponse.json({ error: "You are not assigned to teach this subject/class/term." }, { status: 403 });
  }

  const assignment = await prisma.assignment.create({
    data: { schoolId, title, instructions, subjectId, classId, armId, termId, dueDate, createdById: user.id },
  });

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Assignment", targetId: assignment.id });

  const classStudents = await prisma.student.findMany({
    where: { schoolId, classId, ...(armId ? { armId } : {}) },
    select: { userId: true },
  });
  const studentProfileIds = classStudents.map((s) => s.userId).filter((id): id is string => !!id);
  if (studentProfileIds.length > 0) {
    const profiles = await prisma.studentProfile.findMany({ where: { id: { in: studentProfileIds } }, select: { userId: true } });
    await notifyUsers(profiles.map((p) => p.userId), {
      title: `New assignment: ${title}`,
      body: `Due ${dueDate.toLocaleDateString()}.`,
      link: "/dashboard/student/assignments",
    });
  }

  return NextResponse.json({ assignment }, { status: 201 });
}
