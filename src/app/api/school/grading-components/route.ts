import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { gradingComponentSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET() {
  const { user, response } = await requireApiUser([...ADMIN_AND_STAFF_ROLES, "TEACHER"]);
  if (!user) return response!;

  const components = await prisma.gradingComponent.findMany({
    where: { schoolId: user.schoolId! },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ components });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = gradingComponentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const component = await prisma.gradingComponent.create({
    data: { schoolId: user.schoolId!, ...parsed.data },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "GradingComponent",
    targetId: component.id,
  });

  return NextResponse.json({ component }, { status: 201 });
}
