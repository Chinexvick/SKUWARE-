import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { notifyUsers } from "@/lib/notifications";
import { recordAudit } from "@/lib/auth/audit";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

/**
 * Manual "send it now" version of the fee reminder — triggered from the
 * "no collections today, should we send a reminder?" prompt. Notifies
 * everyone at this school who currently owes anything, not just invoices
 * already past their due date.
 */
export async function POST() {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;
  const schoolId = user.schoolId!;

  const invoices = await prisma.invoice.findMany({
    where: { schoolId, status: { in: ["PENDING", "PARTIALLY_PAID"] } },
    include: { student: { include: { parentLinks: { include: { parent: true } } } } },
  });

  const recipientIds = new Set<string>();
  for (const invoice of invoices) {
    if (invoice.amountDue - invoice.amountPaid <= 0) continue;
    if (invoice.student.userId) {
      const profile = await prisma.studentProfile.findUnique({ where: { id: invoice.student.userId } });
      if (profile) recipientIds.add(profile.userId);
    }
    invoice.student.parentLinks.forEach((l) => recipientIds.add(l.parent.userId));
  }

  if (recipientIds.size > 0) {
    await notifyUsers(Array.from(recipientIds), {
      title: "Fee payment reminder",
      body: "This is a reminder that you have outstanding school fees. Please make payment at your earliest convenience.",
      link: "/dashboard/parent/fees",
    });
  }

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Notification", metadata: { manualFeeReminder: true, recipientCount: recipientIds.size } });

  return NextResponse.json({ remindersSent: recipientIds.size });
}
