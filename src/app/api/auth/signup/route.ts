import { NextRequest, NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword, assessPasswordStrength } from "@/lib/auth/password";
import { signupSchema, slugify } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/auth/rateLimit";
import { recordAudit } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  // Coarse abuse control: cap tenant creation attempts per IP.
  if (isRateLimited(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many signup attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { schoolName, ownerFirstName, ownerLastName, email, phone, password } = parsed.data;

  const strength = assessPasswordStrength(password);
  if (!strength.ok) {
    return NextResponse.json({ error: strength.reason }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Do not reveal whether the account exists beyond a generic message.
    return NextResponse.json(
      { error: "An account with these details could not be created. Try signing in instead." },
      { status: 409 },
    );
  }

  let slug = slugify(schoolName) || "school";
  const clash = await prisma.school.findUnique({ where: { slug } });
  if (clash) {
    slug = `${slug}-${randomBytes(3).toString("hex")}`;
  }

  const passwordHash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({
      data: {
        name: schoolName,
        slug,
        status: "TRIAL",
        email,
        phone,
      },
    });

    const user = await tx.user.create({
      data: {
        schoolId: school.id,
        email,
        phone,
        firstName: ownerFirstName,
        lastName: ownerLastName,
        role: "SCHOOL_OWNER",
        status: "ACTIVE",
        passwordHash,
      },
    });

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await tx.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return { school, user, rawToken };
  });

  // TODO(integration): wire a transactional email provider and send the
  // verification link instead of logging it. Logged here so the flow is
  // testable before email infra exists.
  console.info(
    `[signup] Verification link for ${result.user.email}: ${process.env.APP_URL}/verify-email?token=${result.rawToken}`,
  );

  await recordAudit({
    schoolId: result.school.id,
    userId: result.user.id,
    action: "SIGNUP",
    targetType: "School",
    targetId: result.school.id,
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  return NextResponse.json({
    message: "School created. You can now sign in.",
    school: { id: result.school.id, name: result.school.name, slug: result.school.slug },
  });
}
