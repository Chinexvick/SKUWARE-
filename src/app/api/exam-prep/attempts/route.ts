import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

const submitSchema = z.object({
  examName: z.enum(["JAMB", "WAEC", "NECO", "POST_UTME"]),
  subject: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), chosenAnswer: z.string().min(1).nullable() })).min(1).max(200),
});

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const attempts = await prisma.studentTestAttempt.findMany({
    where: { studentUserId: user.id, ...(req.nextUrl.searchParams.get("examName") ? { examName: req.nextUrl.searchParams.get("examName") as never } : {}) },
    orderBy: { startedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ attempts });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { examName, subject, answers } = parsed.data;

  const questions = await prisma.question.findMany({ where: { id: { in: answers.map((a) => a.questionId) } } });
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  let score = 0;
  const results = answers.map((a) => {
    const q = questionMap.get(a.questionId);
    const correct = !!q && a.chosenAnswer === q.correctAnswer;
    if (correct) score += 1;
    return { ...a, correct };
  });

  const attempt = await prisma.studentTestAttempt.create({
    data: {
      studentUserId: user.id,
      examName,
      subject,
      config: { subject, examName },
      score,
      totalQuestions: answers.length,
      completedAt: new Date(),
      answers: {
        create: results.map((r) => ({ questionId: r.questionId, chosenAnswer: r.chosenAnswer, correct: r.correct })),
      },
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    score,
    totalQuestions: answers.length,
    results: results.map((r) => ({
      questionId: r.questionId,
      correct: r.correct,
      correctAnswer: questionMap.get(r.questionId)?.correctAnswer,
      explanation: questionMap.get(r.questionId)?.explanation,
    })),
  });
}
