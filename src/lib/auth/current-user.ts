import { cookies } from "next/headers";
import { ACCESS_COOKIE_NAME, verifyAccessToken, type AccessTokenClaims } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db";

/** Reads and verifies the access token cookie in a server component / route handler. */
export async function getSessionClaims(): Promise<AccessTokenClaims | null> {
  const store = await cookies();
  const token = store.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

export async function getCurrentUser() {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (!user || user.status !== "ACTIVE") return null;
  return user;
}
