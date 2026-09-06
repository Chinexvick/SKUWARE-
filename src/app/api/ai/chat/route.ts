import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { aiChatSchema } from "@/lib/validation";
import { getAICompletion } from "@/lib/ai/provider";
import { PERSONA_SYSTEM_PROMPTS } from "@/lib/ai/personas";
import { isRateLimited } from "@/lib/auth/rateLimit";
import { buildSchoolSnapshot } from "@/lib/ai/schoolContext";

const PERSONA_ROLE_MAP: Record<string, string[]> = {
  STUDENT_TUTOR: ["STUDENT"],
  TEACHER_ASSISTANT: ["TEACHER"],
  PARENT_ASSISTANT: ["PARENT"],
  SCHOOL_ASSISTANT: ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"],
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = aiChatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { persona, message } = parsed.data;

  if (!PERSONA_ROLE_MAP[persona].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  // AI calls are the platform's most cost-variable feature — cap per user.
  if (isRateLimited(`ai-chat:${user.id}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "You've reached the hourly limit for AI messages. Please try again later." }, { status: 429 });
  }

  let conversationId = parsed.data.conversationId;
  if (conversationId) {
    const existing = await prisma.aIConversation.findFirst({ where: { id: conversationId, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  } else {
    const created = await prisma.aIConversation.create({
      data: { schoolId: user.schoolId, userId: user.id, persona, title: message.slice(0, 60) },
    });
    conversationId = created.id;
  }

  await prisma.aIMessage.create({ data: { conversationId, role: "USER", content: message } });

  const history = await prisma.aIMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  // Ground the parent assistant in the specific child's real data rather than
  // letting the model improvise about a student it has no context for.
  let contextPrefix = "";
  if (persona === "PARENT_ASSISTANT") {
    const parentProfile = await prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: { childLinks: { include: { student: { include: { class: true } } } } },
    });
    const children = parentProfile?.childLinks.map((l) => l.student) ?? [];
    if (children.length > 0) {
      contextPrefix = `Context: this parent's linked children are: ${children
        .map((c) => `${c.firstName} ${c.lastName} (${c.class?.name ?? "unassigned class"})`)
        .join(", ")}. Only discuss these children.\n\n`;
    }
  } else if (persona === "SCHOOL_ASSISTANT" && user.schoolId) {
    contextPrefix = `${await buildSchoolSnapshot(user.schoolId)}\n\n`;
  }

  const completion = await getAICompletion(
    PERSONA_SYSTEM_PROMPTS[persona],
    history.map((m, i) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: i === history.length - 1 && m.role === "USER" ? contextPrefix + m.content : m.content,
    })),
  );

  await prisma.aIMessage.create({ data: { conversationId, role: "ASSISTANT", content: completion.text } });

  return NextResponse.json({ conversationId, reply: completion.text, configured: completion.error !== "not_configured" });
}
