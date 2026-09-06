import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { staffSchema } from "@/lib/validation";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/auth/audit";
import { safeUserSelect } from "@/lib/auth/safe-user";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const staff = await prisma.staffProfile.findMany({
    where: { schoolId: user.schoolId! },
    include: { user: { select: safeUserSelect }, department: true },
    orderBy: { user: { lastName: "asc" } },
  });
  return NextResponse.json({ staff });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = staffSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { firstName, lastName, email, phone, role, designation, departmentId } = parsed.data;
  const schoolId = user.schoolId!;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({ where: { id: departmentId, schoolId } });
    if (!dept) return NextResponse.json({ error: "Department not found." }, { status: 404 });
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(tempPassword);

  const staffProfile = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        schoolId,
        email,
        phone,
        firstName,
        lastName,
        role,
        status: "ACTIVE",
        passwordHash,
      },
    });
    return tx.staffProfile.create({
      data: { schoolId, userId: newUser.id, designation, departmentId },
      include: { user: { select: safeUserSelect }, department: true },
    });
  });

  // TODO(integration): email the temporary password/invite link instead of
  // logging it, once a transactional email provider is wired up.
  console.info(`[staff-invite] ${email} temporary password: ${tempPassword}`);

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "StaffProfile",
    targetId: staffProfile.id,
    metadata: { invitedRole: role },
  });

  return NextResponse.json(
    {
      staff: staffProfile,
      // Surfaced once, here, only because there is no email provider yet.
      temporaryPassword: tempPassword,
    },
    { status: 201 },
  );
}
