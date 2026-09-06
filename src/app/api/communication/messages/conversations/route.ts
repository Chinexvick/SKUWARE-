import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

/** The people this user has an existing message thread with, most recent first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { recipientId: user.id }] },
    include: {
      sender: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
      recipient: { select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const byPartner = new Map<
    string,
    { partner: { id: string; firstName: string; lastName: string; role: string; avatarUrl: string | null }; lastBody: string; lastAt: string; unread: number }
  >();

  for (const m of messages) {
    const partner = m.senderId === user.id ? m.recipient : m.sender;
    const existing = byPartner.get(partner.id);
    const isUnread = m.recipientId === user.id && !m.readAt;
    if (!existing) {
      byPartner.set(partner.id, {
        partner,
        lastBody: m.body,
        lastAt: m.createdAt.toISOString(),
        unread: isUnread ? 1 : 0,
      });
    } else if (isUnread) {
      existing.unread += 1;
    }
  }

  return NextResponse.json({ conversations: Array.from(byPartner.values()) });
}
