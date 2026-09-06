import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

/** Whether any payment has been recorded today — feeds the "no collections today, send a reminder?" prompt. */
export async function GET() {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [paymentsToday, outstandingCount] = await Promise.all([
    prisma.payment.count({ where: { schoolId: user.schoolId!, paidAt: { gte: startOfDay } } }),
    prisma.invoice.count({ where: { schoolId: user.schoolId!, status: { in: ["PENDING", "PARTIALLY_PAID"] } } }),
  ]);

  return NextResponse.json({
    hasCollectedToday: paymentsToday > 0,
    hoursSinceMidnight: (Date.now() - startOfDay.getTime()) / (1000 * 60 * 60),
    outstandingCount,
  });
}
