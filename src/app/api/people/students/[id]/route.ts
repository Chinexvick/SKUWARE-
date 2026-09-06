import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { studentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";
import { safeUserSelect } from "@/lib/auth/safe-user";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;
  const { id } = await params;

  const student = await prisma.student.findFirst({
    where: { id, schoolId: user.schoolId! },
    include: {
      class: true,
      arm: true,
      parentLinks: { include: { parent: { include: { user: { select: safeUserSelect } } } } },
    },
  });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  return NextResponse.json({ student });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const { id } = await params;

  const existing = await prisma.student.findFirst({ where: { id, schoolId: user.schoolId! } });
  if (!existing) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = studentSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const student = await prisma.student.update({ where: { id }, data: parsed.data });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_UPDATED",
    targetType: "Student",
    targetId: id,
  });

  return NextResponse.json({ student });
}
