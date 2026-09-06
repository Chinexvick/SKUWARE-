import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notifyUsers } from "@/lib/notifications";
import { displayName } from "@/lib/displayName";

const bodySchema = z.object({ emoji: z.string().trim().min(1).max(8) });

/** Toggles the current user's reaction on a direct message — react again with the same emoji to remove it. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const message = await prisma.message.findUnique({ where: { id } });
  if (!message || (message.senderId !== user.id && message.recipientId !== user.id)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId_emoji: { messageId: id, userId: user.id, emoji: parsed.data.emoji } },
  });

  if (existing) {
    await prisma.messageReaction.delete({ where: { id: existing.id } });
  } else {
    await prisma.messageReaction.create({ data: { messageId: id, userId: user.id, emoji: parsed.data.emoji } });
    const otherPartyId = message.senderId === user.id ? message.recipientId : message.senderId;
    if (otherPartyId !== user.id) {
      await notifyUsers([otherPartyId], {
        title: `${displayName(user)} reacted ${parsed.data.emoji}`,
        body: message.body.slice(0, 100),
        link: "/dashboard/messages",
      });
    }
  }

  const allReactions = await prisma.messageReaction.findMany({ where: { messageId: id }, select: { emoji: true, userId: true } });
  const grouped = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();
  for (const r of allReactions) {
    const bucket = grouped.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
    bucket.count += 1;
    if (r.userId === user.id) bucket.reactedByMe = true;
    grouped.set(r.emoji, bucket);
  }

  return NextResponse.json({ reactions: Array.from(grouped.values()) });
}
