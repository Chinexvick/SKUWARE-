import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { sessionSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const sessions = await prisma.academicSession.findMany({
    where: { schoolId: user.schoolId! },
    include: { terms: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ sessions });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, startDate, endDate, isCurrent } = parsed.data;

  if (endDate <= startDate) {
    return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
  }

  const schoolId = user.schoolId!;

  const session = await prisma.$transaction(async (tx) => {
    if (isCurrent) {
      await tx.academicSession.updateMany({ where: { schoolId, isCurrent: true }, data: { isCurrent: false } });
    }
    return tx.academicSession.create({
      data: { schoolId, name, startDate, endDate, isCurrent: !!isCurrent },
    });
  });

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "AcademicSession",
    targetId: session.id,
  });

  return NextResponse.json({ session }, { status: 201 });
}
