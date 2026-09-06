import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { armSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const { id: classId } = await params;

  const klass = await prisma.class.findFirst({ where: { id: classId, schoolId: user.schoolId! } });
  if (!klass) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = armSchema.safeParse({ ...body, classId });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const arm = await prisma.arm.create({ data: { classId, name: parsed.data.name } });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Arm",
    targetId: arm.id,
  });

  return NextResponse.json({ arm }, { status: 201 });
}
