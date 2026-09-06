import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const conversationId = req.nextUrl.searchParams.get("id");
  if (conversationId) {
    const conversation = await prisma.aIConversation.findFirst({
      where: { id: conversationId, userId: user.id },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({ conversation });
  }

  const persona = req.nextUrl.searchParams.get("persona") ?? undefined;
  const conversations = await prisma.aIConversation.findMany({
    where: { userId: user.id, ...(persona ? { persona: persona as never } : {}) },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ conversations });
}
