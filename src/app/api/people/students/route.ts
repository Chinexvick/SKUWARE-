import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { studentSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/auth/rateLimit";
import { recordAudit } from "@/lib/auth/audit";
import { hashPassword, generateTemporaryPassword } from "@/lib/auth/password";

export async function GET(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const classId = req.nextUrl.searchParams.get("classId") ?? undefined;
  const search = req.nextUrl.searchParams.get("q")?.trim();

  const students = await prisma.student.findMany({
    where: {
      schoolId: user.schoolId!,
      ...(classId ? { classId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { admissionNo: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { class: true, arm: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 200,
  });

  return NextResponse.json({ students });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const ip = getClientIp(req.headers);
  if (isRateLimited(`create-student:${user.schoolId}`, 100, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many records created recently. Please slow down." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { admissionNo, firstName, lastName, gender, dateOfBirth, classId, armId, email } = parsed.data;
  const schoolId = user.schoolId!;

  const duplicate = await prisma.student.findUnique({ where: { schoolId_admissionNo: { schoolId, admissionNo } } });
  if (duplicate) {
    return NextResponse.json({ error: "A student with this admission number already exists." }, { status: 409 });
  }

  if (email) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
    }
  }

  if (classId) {
    const klass = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!klass) return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  if (armId) {
    const arm = await prisma.arm.findFirst({ where: { id: armId, classId: classId ?? undefined } });
    if (!arm) return NextResponse.json({ error: "Arm not found for the given class." }, { status: 404 });
  }

  const tempPassword = email ? generateTemporaryPassword() : null;

  const student = await prisma.$transaction(async (tx) => {
    let userId: string | undefined;
    if (email && tempPassword) {
      const passwordHash = await hashPassword(tempPassword);
      const loginUser = await tx.user.create({
        data: { schoolId, email, firstName, lastName, role: "STUDENT", status: "ACTIVE", passwordHash },
      });
      const profile = await tx.studentProfile.create({ data: { userId: loginUser.id } });
      userId = profile.id;
    }
    return tx.student.create({
      data: { schoolId, admissionNo, firstName, lastName, gender, dateOfBirth, classId, armId, userId },
    });
  });

  if (tempPassword && email) {
    // TODO(integration): email the temporary password/invite link instead of
    // logging it, once a transactional email provider is wired up.
    console.info(`[student-invite] ${email} temporary password: ${tempPassword}`);
  }

  await recordAudit({
    schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Student",
    targetId: student.id,
    ip,
  });

  return NextResponse.json(
    { student, ...(tempPassword ? { temporaryPassword: tempPassword } : {}) },
    { status: 201 },
  );
}
