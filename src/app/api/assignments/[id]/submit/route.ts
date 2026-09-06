import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { submissionSchema } from "@/lib/validation";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const { id: assignmentId } = await params;

  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
  if (!profile?.student) return NextResponse.json({ error: "No student record linked to this account." }, { status: 403 });

  const assignment = await prisma.assignment.findFirst({ where: { id: assignmentId, classId: profile.student.classId ?? "__none__" } });
  if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const submission = await prisma.assignmentSubmission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: profile.student.id } },
    create: { assignmentId, studentId: profile.student.id, content: parsed.data.content },
    update: { content: parsed.data.content, submittedAt: new Date() },
  });

  return NextResponse.json({ submission });
}
