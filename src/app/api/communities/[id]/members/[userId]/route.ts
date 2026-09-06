import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

const bodySchema = z.object({ isAdmin: z.boolean() });

/** Promote/demote a community member — only existing community admins can do this. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id, userId } = await params;

  const callerMembership = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: id, userId: user.id } } });
  if (!callerMembership?.isAdmin) return NextResponse.json({ error: "Only community admins can do this." }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const targetMembership = await prisma.communityMember.findUnique({ where: { communityId_userId: { communityId: id, userId } } });
  if (!targetMembership) return NextResponse.json({ error: "That person is not a member of this community." }, { status: 404 });

  const updated = await prisma.communityMember.update({
    where: { id: targetMembership.id },
    data: { isAdmin: parsed.data.isAdmin },
  });

  return NextResponse.json({ member: updated });
}
