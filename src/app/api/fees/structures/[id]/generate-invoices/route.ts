import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";
import { notifyUsers } from "@/lib/notifications";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

/**
 * Bills every student a fee structure applies to for its term — the actual
 * "how does the system know how much each student owes" answer: it reads
 * the structure's class + amount and stamps out one invoice per student,
 * skipping anyone already invoiced for this structure so it's safe to
 * re-run (e.g. after new students join the class).
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;
  const { id } = await params;
  const schoolId = user.schoolId!;

  const structure = await prisma.feeStructure.findFirst({ where: { id, schoolId } });
  if (!structure) return NextResponse.json({ error: "Fee structure not found." }, { status: 404 });

  const students = await prisma.student.findMany({
    where: { schoolId, ...(structure.classId ? { classId: structure.classId } : {}) },
    select: { id: true, userId: true },
  });

  const alreadyInvoiced = await prisma.invoice.findMany({
    where: { feeStructureId: structure.id },
    select: { studentId: true },
  });
  const invoicedIds = new Set(alreadyInvoiced.map((i) => i.studentId));
  const toInvoice = students.filter((s) => !invoicedIds.has(s.id));

  if (toInvoice.length > 0) {
    await prisma.invoice.createMany({
      data: toInvoice.map((s) => ({
        schoolId,
        studentId: s.id,
        feeStructureId: structure.id,
        description: structure.name,
        amountDue: structure.amount,
        status: "PENDING",
      })),
    });

    await recordAudit({
      schoolId,
      userId: user.id,
      action: "RECORD_CREATED",
      targetType: "Invoice",
      targetId: structure.id,
      metadata: { bulkGenerate: true, feeStructureId: structure.id, count: toInvoice.length },
    });

    const invoicedStudentUserProfileIds = students
      .filter((s) => toInvoice.some((t) => t.id === s.id) && s.userId)
      .map((s) => s.userId!)
      .filter((v): v is string => !!v);
    if (invoicedStudentUserProfileIds.length > 0) {
      const profiles = await prisma.studentProfile.findMany({
        where: { id: { in: invoicedStudentUserProfileIds } },
        select: { userId: true },
      });
      await notifyUsers(profiles.map((p) => p.userId), {
        title: `New invoice: ${structure.name}`,
        body: `A fee of ₦${structure.amount.toLocaleString("en-NG")} has been billed to your account.`,
        link: "/dashboard/student",
      });
    }
  }

  return NextResponse.json({
    created: toInvoice.length,
    skipped: students.length - toInvoice.length,
    totalStudents: students.length,
  });
}
