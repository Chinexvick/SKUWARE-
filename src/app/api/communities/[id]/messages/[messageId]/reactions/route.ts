import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notifyUsers } from "@/lib/notifications";
import { displayName } from "@/lib/displayName";

const bodySchema = z.object({ emoji: z.string().trim().min(1).max(8) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; messageId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id, messageId } = await params;

  const membership = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: id, userId: user.id } } });
  if (!membership) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const message = await prisma.communityMessage.findFirst({ where: { id: messageId, communityId: id } });
  if (!message) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const existing = await prisma.communityMessageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: user.id, emoji: parsed.data.emoji } },
  });

  if (existing) {
    await prisma.communityMessageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.communityMessageReaction.create({ data: { messageId, userId: user.id, emoji: parsed.data.emoji } });
    if (message.senderId !== user.id) {
      await notifyUsers([message.senderId], {
        title: `${displayName(user)} reacted ${parsed.data.emoji}`,
        body: message.body.slice(0, 100),
        link: "/dashboard/messages",
      });
    }
  }

  const allReactions = await prisma.communityMessageReaction.findMany({ where: { messageId }, select: { emoji: true, userId: true } });
  const grouped = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();
  for (const r of allReactions) {
    const bucket = grouped.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
    bucket.count += 1;
    if (r.userId === user.id) bucket.reactedByMe = true;
    grouped.set(r.emoji, bucket);
  }

  return NextResponse.json({ reactions: Array.from(grouped.values()) });
}
