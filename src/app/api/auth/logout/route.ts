import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { REFRESH_COOKIE_NAME, ACCESS_COOKIE_NAME, clearedCookieOptions } from "@/lib/auth/jwt";
import { hashRefreshToken } from "@/lib/auth/tokens";
import { getSessionClaims } from "@/lib/auth/current-user";
import { recordAudit } from "@/lib/auth/audit";

export async function POST(req: NextRequest) {
  const claims = await getSessionClaims();
  const rawToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (rawToken) {
    const tokenHash = hashRefreshToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  if (claims) {
    await recordAudit({ userId: claims.sub, schoolId: claims.schoolId, action: "LOGOUT" });
  }

  const res = NextResponse.json({ message: "Signed out." });
  res.cookies.set(ACCESS_COOKIE_NAME, "", clearedCookieOptions);
  res.cookies.set(REFRESH_COOKIE_NAME, "", { ...clearedCookieOptions, path: "/api/auth" });
  return res;
}
