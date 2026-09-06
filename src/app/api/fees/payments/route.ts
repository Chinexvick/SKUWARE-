import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { paymentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

// No payment gateway is wired up yet (Paystack/Flutterwave keys not configured).
// This records payments reported through offline channels (bank transfer, cash,
// POS) so schools can track collections today; wiring a gateway later is a
// matter of adding a webhook that calls this same recording logic.

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { invoiceId, amount, method, reference } = parsed.data;
  const schoolId = user.schoolId!;

  const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, schoolId } });
  if (!invoice) return NextResponse.json({ error: "Invoice not found." }, { status: 404 });

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: { schoolId, invoiceId, amount, method, reference, status: "SUCCESSFUL", recordedById: user.id },
    });

    const newAmountPaid = invoice.amountPaid + amount;
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        status: newAmountPaid >= invoice.amountDue ? "PAID" : "PARTIALLY_PAID",
      },
    });

    return created;
  });

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Payment",
    targetId: payment.id,
    metadata: { invoiceId, amount },
  });

  return NextResponse.json({ payment }, { status: 201 });
}
