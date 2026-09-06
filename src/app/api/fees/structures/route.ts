import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { feeStructureSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import type { UserRole } from "@prisma/client";

const FEES_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"];

export async function GET() {
  const { user, response } = await requireApiUser([...FEES_ROLES, "PRINCIPAL", "VICE_PRINCIPAL"]);
  if (!user) return response!;

  const structures = await prisma.feeStructure.findMany({
    where: { schoolId: user.schoolId! },
    include: { term: true, class: true },
    orderBy: { term: { startDate: "desc" } },
  });
  return NextResponse.json({ structures });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(FEES_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = feeStructureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, amount, termId, classId } = parsed.data;
  const schoolId = user.schoolId!;

  const term = await prisma.term.findFirst({ where: { id: termId, session: { schoolId } } });
  if (!term) return NextResponse.json({ error: "Term not found." }, { status: 404 });
  if (classId) {
    const klass = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const structure = await prisma.feeStructure.create({ data: { schoolId, name, amount, termId, classId } });

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "FeeStructure", targetId: structure.id });

  return NextResponse.json({ structure }, { status: 201 });
}
