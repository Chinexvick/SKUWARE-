import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { classSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const classes = await prisma.class.findMany({
    where: { schoolId: user.schoolId! },
    include: { arms: true, _count: { select: { students: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ classes });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = classSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const klass = await prisma.class.create({ data: { schoolId: user.schoolId!, name: parsed.data.name } });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Class",
    targetId: klass.id,
  });

  return NextResponse.json({ class: klass }, { status: 201 });
}
