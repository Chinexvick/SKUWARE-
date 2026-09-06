import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { questionGenerateSchema } from "@/lib/validation";
import { getAICompletion, extractJson } from "@/lib/ai/provider";
import { isRateLimited } from "@/lib/auth/rateLimit";

interface GeneratedQuestion {
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

const SYSTEM_PROMPT = `You are an exam-question generator for Nigerian secondary school examinations
(JAMB/UTME, WAEC, NECO, Post-UTME). Generate original multiple-choice questions in the style and
difficulty of the requested exam — do not reproduce real past questions verbatim, generate new
ones that test the same syllabus concepts. Always respond with ONLY a JSON array, no prose, in
this exact shape:
[{"prompt": "...", "options": ["A text","B text","C text","D text"], "correctAnswer": "A text", "explanation": "..."}]
Each question must have exactly 4 options, and correctAnswer must exactly match one of the options.`;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (user.role !== "STUDENT") return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  if (isRateLimited(`ai-question-gen:${user.id}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You've reached the hourly limit for generating practice tests. Please try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = questionGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { examName, subject, topic, difficulty, count } = parsed.data;

  const userPrompt = `Generate ${count} ${difficulty}-difficulty multiple-choice questions for the
${examName} examination, subject: ${subject}${topic ? `, topic: ${topic}` : ""}. Respond with only the JSON array.`;

  const completion = await getAICompletion(SYSTEM_PROMPT, [{ role: "user", content: userPrompt }], { maxTokens: 4096 });

  if (!completion.ok) {
    return NextResponse.json({ error: completion.text, configured: completion.error !== "not_configured" }, { status: 503 });
  }

  const generated = extractJson<GeneratedQuestion[]>(completion.text);
  if (!generated || !Array.isArray(generated) || generated.length === 0) {
    return NextResponse.json({ error: "The AI response could not be parsed into questions. Please try again." }, { status: 502 });
  }

  const topicRecord = topic
    ? await prisma.topic.upsert({
        where: { examName_subject_name: { examName, subject, name: topic } },
        create: { examName, subject, name: topic },
        update: {},
      })
    : null;

  const created = await prisma.$transaction(
    generated
      .filter((q) => q.prompt && Array.isArray(q.options) && q.options.length >= 2 && q.correctAnswer)
      .map((q) =>
        prisma.question.create({
          data: {
            examName,
            subject,
            topicId: topicRecord?.id,
            difficulty,
            promptText: q.prompt,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            source: "AI_GENERATED",
            reviewStatus: "DRAFT",
            createdById: user.id,
          },
        }),
      ),
  );

  return NextResponse.json({
    questions: created.map((q) => ({
      id: q.id,
      prompt: q.promptText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    })),
  });
}
