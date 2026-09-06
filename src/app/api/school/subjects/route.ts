import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { subjectSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const subjects = await prisma.subject.findMany({
    where: { schoolId: user.schoolId! },
    include: { department: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ subjects });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = subjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: parsed.data.departmentId, schoolId: user.schoolId! },
    });
    if (!dept) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }
  }

  const subject = await prisma.subject.create({
    data: {
      schoolId: user.schoolId!,
      name: parsed.data.name,
      code: parsed.data.code,
      departmentId: parsed.data.departmentId,
    },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Subject",
    targetId: subject.id,
  });

  return NextResponse.json({ subject }, { status: 201 });
}
