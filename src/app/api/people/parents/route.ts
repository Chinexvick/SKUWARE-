import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { parentSchema } from "@/lib/validation";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth/password";
import { recordAudit } from "@/lib/auth/audit";
import { safeUserSelect } from "@/lib/auth/safe-user";

export async function GET() {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const parents = await prisma.parentProfile.findMany({
    where: { schoolId: user.schoolId! },
    include: { user: { select: safeUserSelect }, childLinks: { include: { student: true } } },
    orderBy: { user: { lastName: "asc" } },
  });
  return NextResponse.json({ parents });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = parentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { firstName, lastName, email, phone, studentAdmissionNos } = parsed.data;
  const schoolId = user.schoolId!;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  let studentsToLink: { id: string }[] = [];
  if (studentAdmissionNos.length > 0) {
    studentsToLink = await prisma.student.findMany({
      where: { schoolId, admissionNo: { in: studentAdmissionNos } },
      select: { id: true },
    });
    if (studentsToLink.length !== studentAdmissionNos.length) {
      return NextResponse.json(
        { error: "One or more admission numbers could not be found at this school." },
        { status: 404 },
      );
    }
  }

  const tempPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(tempPassword);

  const parentProfile = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { schoolId, email, phone, firstName, lastName, role: "PARENT", status: "ACTIVE", passwordHash },
    });
    const profile = await tx.parentProfile.create({ data: { schoolId, userId: newUser.id } });
    if (studentsToLink.length > 0) {
      await tx.studentParentLink.createMany({
        data: studentsToLink.map((s) => ({ studentId: s.id, parentId: profile.id })),
      });
    }
    return tx.parentProfile.findUniqueOrThrow({
      where: { id: profile.id },
      include: { user: { select: safeUserSelect }, childLinks: { include: { student: true } } },
    });
  });

  console.info(`[parent-invite] ${email} temporary password: ${tempPassword}`);

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "ParentProfile",
    targetId: parentProfile.id,
  });

  return NextResponse.json({ parent: parentProfile, temporaryPassword: tempPassword }, { status: 201 });
}
