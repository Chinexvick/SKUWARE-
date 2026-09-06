import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { admissionApplicationSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

// Public online application intake is deferred with the marketing/landing
// site; for now admissions staff record applications directly (phone/email/
// walk-in intake), which still gives the full review -> approve -> student
// account pipeline described in the product blueprint.

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const applications = await prisma.admissionApplication.findMany({
    where: { schoolId: user.schoolId! },
    include: { desiredClass: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = admissionApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const application = await prisma.admissionApplication.create({
    data: { schoolId: user.schoolId!, ...parsed.data, status: "SUBMITTED" },
  });

  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "AdmissionApplication", targetId: application.id });

  return NextResponse.json({ application }, { status: 201 });
}
