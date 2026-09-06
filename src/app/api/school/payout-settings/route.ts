import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";
import { Prisma } from "@prisma/client";

const payoutSchema = z.object({
  bankName: z.string().trim().min(1).max(100),
  accountNumber: z.string().trim().min(6).max(20),
  accountName: z.string().trim().min(1).max(150),
});

/**
 * Stores where fee collections should eventually be paid out — this is data
 * entry only. Actually moving money on a schedule requires a real payment
 * gateway's subaccount/transfer API (Paystack, Flutterwave) wired in with
 * live credentials; until that's connected, this is the account information
 * ready to hand to that integration the moment it exists.
 */
export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const school = await prisma.school.findUnique({ where: { id: user.schoolId! }, select: { settings: true } });
  const settings = (school?.settings as Record<string, unknown>) ?? {};
  return NextResponse.json({ payout: settings.payout ?? null });
}

export async function PUT(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const parsed = payoutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const school = await prisma.school.findUnique({ where: { id: user.schoolId! }, select: { settings: true } });
  const settings = (school?.settings as Record<string, unknown>) ?? {};

  const updated = await prisma.school.update({
    where: { id: user.schoolId! },
    data: { settings: { ...settings, payout: parsed.data } as Prisma.InputJsonValue },
  });

  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_UPDATED", targetType: "School", targetId: updated.id, metadata: { field: "payout" } });

  return NextResponse.json({ payout: parsed.data });
}
