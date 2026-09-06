import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { notifyUsers } from "@/lib/notifications";
import { checkMessage } from "@/lib/moderation";
import { displayName } from "@/lib/displayName";

const sendSchema = z.object({ body: z.string().trim().min(1).max(2000) });

async function requireMember(userId: string, communityId: string) {
  return prisma.communityMember.findUnique({ where: { communityId_userId: { communityId, userId } } });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const membership = await requireMember(user.id, id);
  if (!membership) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const [community, messages] = await Promise.all([
    prisma.community.findUnique({
      where: { id },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } } } },
    }),
    prisma.communityMessage.findMany({
      where: { communityId: id },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
        reactions: { select: { emoji: true, userId: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 300,
    }),
  ]);

  await prisma.communityMember.update({ where: { id: membership.id }, data: { lastReadAt: new Date() } });

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

  return NextResponse.json({ community, messages: withReactionSummary, isAdmin: membership.isAdmin });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const membership = await requireMember(user.id, id);
  if (!membership) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const parsed = sendSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Message can't be empty." }, { status: 400 });

  const moderation = checkMessage(parsed.data.body);
  if (moderation.blocked) {
    return NextResponse.json(
      {
        error: `The word "${moderation.flaggedWord}" is not allowed for the safety of all members.`,
        flaggedWord: moderation.flaggedWord,
      },
      { status: 422 },
    );
  }

  const [message, community, otherMembers] = await Promise.all([
    prisma.communityMessage.create({
      data: { communityId: id, senderId: user.id, body: parsed.data.body },
      include: { sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } } },
    }),
    prisma.community.findUnique({ where: { id }, select: { name: true } }),
    prisma.communityMember.findMany({ where: { communityId: id, userId: { not: user.id } }, select: { userId: true } }),
  ]);

  await notifyUsers(otherMembers.map((m) => m.userId), {
    title: community?.name ?? "Community message",
    body: `${displayName(user)}: ${parsed.data.body.slice(0, 120)}`,
    link: "/dashboard/messages",
  });

  return NextResponse.json({ message }, { status: 201 });
}
