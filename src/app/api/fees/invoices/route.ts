import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { getCurrentUser } from "@/lib/auth/current-user";
import { invoiceSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const studentIdParam = req.nextUrl.searchParams.get("studentId");

  if (FEES_ROLES.includes(user.role) || user.role === "PRINCIPAL" || user.role === "VICE_PRINCIPAL") {
    const invoices = await prisma.invoice.findMany({
      where: { schoolId: user.schoolId!, ...(studentIdParam ? { studentId: studentIdParam } : {}) },
      include: { student: true, payments: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ invoices });
  }

  if (user.role === "PARENT") {
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id }, include: { childLinks: true } });
    const childIds = parentProfile?.childLinks.map((l) => l.studentId) ?? [];
    if (studentIdParam && !childIds.includes(studentIdParam)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
    const invoices = await prisma.invoice.findMany({
      where: { studentId: studentIdParam ? studentIdParam : { in: childIds } },
      include: { student: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invoices });
  }

  if (user.role === "STUDENT") {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
    if (!profile?.student) return NextResponse.json({ invoices: [] });
    const invoices = await prisma.invoice.findMany({
      where: { studentId: profile.student.id },
      include: { payments: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invoices });
  }

  return NextResponse.json({ error: "Forbidden." }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = invoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { studentId, feeStructureId, description, amountDue, dueDate } = parsed.data;
  const schoolId = user.schoolId!;

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const invoice = await prisma.invoice.create({
    data: { schoolId, studentId, feeStructureId, description, amountDue, dueDate, status: "PENDING" },
  });

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Invoice", targetId: invoice.id });

  return NextResponse.json({ invoice }, { status: 201 });
}
