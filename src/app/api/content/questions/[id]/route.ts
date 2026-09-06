import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";

const reviewSchema = z.object({ reviewStatus: z.enum(["APPROVED", "FLAGGED", "DRAFT"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);
  if (!user) return response!;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const question = await prisma.question.update({ where: { id }, data: { reviewStatus: parsed.data.reviewStatus } });

  await recordAudit({ userId: user.id, action: "RECORD_UPDATED", targetType: "Question", targetId: id, metadata: { reviewStatus: parsed.data.reviewStatus } });

  return NextResponse.json({ question });
}
