import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { loginSchema } from "@/lib/validation";
import { isRateLimited, getClientIp } from "@/lib/auth/rateLimit";
import { recordAudit } from "@/lib/auth/audit";
import {
  signAccessToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/jwt";
import { generateRefreshToken } from "@/lib/auth/tokens";
import { ROLE_DASHBOARD_PATH } from "@/lib/auth/rbac";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent");

  if (isRateLimited(`login:${ip}`, 20, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts from this location. Please try again later." },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Rate-limit per-account too, independent of IP, to blunt distributed guessing.
  if (isRateLimited(`login-account:${email}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many login attempts for this account. Please try again later." },
      { status: 429 },
    );
  }

  const genericError = NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await recordAudit({ action: "LOGIN_FAILED", ip, userAgent, metadata: { email, reason: "no_such_user" } });
    return genericError;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await recordAudit({
      schoolId: user.schoolId,
      userId: user.id,
      action: "LOGIN_FAILED",
      ip,
      userAgent,
      metadata: { reason: "locked" },
    });
    return NextResponse.json(
      { error: "This account is temporarily locked due to repeated failed attempts. Try again later." },
      { status: 423 },
    );
  }

  if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
    await recordAudit({
      schoolId: user.schoolId,
      userId: user.id,
      action: "LOGIN_FAILED",
      ip,
      userAgent,
      metadata: { reason: "account_" + user.status.toLowerCase() },
    });
    return NextResponse.json({ error: "This account is not active. Contact your school administrator." }, { status: 403 });
  }

  const validPassword = await verifyPassword(password, user.passwordHash);
  if (!validPassword) {
    const failedAttempts = user.failedAttempts + 1;
    const shouldLock = failedAttempts >= MAX_FAILED_ATTEMPTS;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedAttempts: shouldLock ? 0 : failedAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
      },
    });
    await recordAudit({
      schoolId: user.schoolId,
      userId: user.id,
      action: "LOGIN_FAILED",
      ip,
      userAgent,
      metadata: { reason: "bad_password", locked: shouldLock },
    });
    return genericError;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedAttempts: 0, lockedUntil: null, lastLoginAt: new Date(), lastLoginIp: ip },
  });

  const accessToken = await signAccessToken({ sub: user.id, schoolId: user.schoolId, role: user.role });
  const { token: refreshToken, tokenHash, expiresAt } = generateRefreshToken();

  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash, expiresAt, userAgent, ip },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "LOGIN_SUCCESS",
    ip,
    userAgent,
  });

  const res = NextResponse.json({
    message: "Signed in.",
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      schoolId: user.schoolId,
    },
    redirectTo: ROLE_DASHBOARD_PATH[user.role],
  });

  res.cookies.set(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookies.set(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions);

  return res;
}
