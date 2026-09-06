import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  signAccessToken,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  accessCookieOptions,
  refreshCookieOptions,
  clearedCookieOptions,
} from "@/lib/auth/jwt";
import { generateRefreshToken, hashRefreshToken } from "@/lib/auth/tokens";
import { getClientIp, isRateLimited } from "@/lib/auth/rateLimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`refresh:${ip}`, 60, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const rawToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;
  if (!rawToken) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const tokenHash = hashRefreshToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash }, include: { user: true } });

  const invalidate = () => {
    const res = NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    res.cookies.set(ACCESS_COOKIE_NAME, "", clearedCookieOptions);
    res.cookies.set(REFRESH_COOKIE_NAME, "", { ...clearedCookieOptions, path: "/api/auth" });
    return res;
  };

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    // Reuse of a revoked/expired token is a signal of possible theft — revoke
    // the whole token family for this user as a precaution.
    if (stored && !stored.revokedAt) {
      await prisma.refreshToken.updateMany({
        where: { userId: stored.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return invalidate();
  }

  const { user } = stored;
  if (user.status !== "ACTIVE") {
    return invalidate();
  }

  // Rotate: revoke the used token and issue a new one.
  const { token: newRefreshToken, tokenHash: newHash, expiresAt } = generateRefreshToken();
  await prisma.$transaction([
    prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } }),
    prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: newHash, expiresAt, ip, userAgent: req.headers.get("user-agent") },
    }),
  ]);

  const accessToken = await signAccessToken({ sub: user.id, schoolId: user.schoolId, role: user.role });

  const res = NextResponse.json({ message: "Session refreshed." });
  res.cookies.set(ACCESS_COOKIE_NAME, accessToken, accessCookieOptions);
  res.cookies.set(REFRESH_COOKIE_NAME, newRefreshToken, refreshCookieOptions);
  return res;
}
