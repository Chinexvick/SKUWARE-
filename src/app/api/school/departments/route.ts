import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { departmentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const departments = await prisma.department.findMany({
    where: { schoolId: user.schoolId! },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ departments });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = departmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const department = await prisma.department.create({
    data: { schoolId: user.schoolId!, name: parsed.data.name },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Department",
    targetId: department.id,
  });

  return NextResponse.json({ department }, { status: 201 });
}
