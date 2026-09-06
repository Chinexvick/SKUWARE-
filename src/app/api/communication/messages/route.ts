import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { messageSchema } from "@/lib/validation";
import { notifyUsers } from "@/lib/notifications";
import { checkMessage } from "@/lib/moderation";
import { displayName } from "@/lib/displayName";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get("with");

  const messages = await prisma.message.findMany({
    where: {
      schoolId: user.schoolId!,
      OR: [
        { senderId: user.id, ...(withUserId ? { recipientId: withUserId } : {}) },
        { recipientId: user.id, ...(withUserId ? { senderId: withUserId } : {}) },
      ],
    },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, role: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  await prisma.message.updateMany({
    where: { recipientId: user.id, readAt: null, ...(withUserId ? { senderId: withUserId } : {}) },
    data: { readAt: new Date() },
  });

  const withReactionSummary = messages.map((m) => {
    const grouped = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();
    for (const r of m.reactions) {
      const bucket = grouped.get(r.emoji) ?? { emoji: r.emoji, count: 0, reactedByMe: false };
      bucket.count += 1;
      if (r.userId === user.id) bucket.reactedByMe = true;
      grouped.set(r.emoji, bucket);
    }
    return { ...m, reactions: Array.from(grouped.values()) };
  });

  return NextResponse.json({ messages: withReactionSummary });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { recipientId, body: text } = parsed.data;

  const recipient = await prisma.user.findFirst({ where: { id: recipientId, schoolId: user.schoolId! } });
  if (!recipient) return NextResponse.json({ error: "Recipient not found at this school." }, { status: 404 });

  const moderation = checkMessage(text);
  if (moderation.blocked) {
    return NextResponse.json(
      {
        error: `The word "${moderation.flaggedWord}" is not allowed for the safety of all members.`,
        flaggedWord: moderation.flaggedWord,
      },
      { status: 422 },
    );
  }

  const message = await prisma.message.create({
    data: { schoolId: user.schoolId!, senderId: user.id, recipientId, body: text },
  });

  await notifyUsers([recipientId], {
    title: `New message from ${displayName(user)}`,
    body: text.slice(0, 140),
    link: "/dashboard/messages",
  });

  return NextResponse.json({ message }, { status: 201 });
}
