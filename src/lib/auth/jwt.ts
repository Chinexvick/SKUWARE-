import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

// Edge-safe (no Node "crypto" import here) — this file is loaded by middleware.

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

let cachedFallbackSecret: Uint8Array | null = null;

// Fallback used only when the AUTH_JWT_SECRET environment variable isn't
// reachable on the deploy target (e.g. a hosting dashboard that won't let
// the project add one). Derived from DATABASE_URL via SHA-256 (Web Crypto,
// so this stays edge-safe) instead of a literal committed to the repo —
// still, set a real AUTH_JWT_SECRET and remove this fallback before
// handling real user data.
async function getFallbackSecret(): Promise<Uint8Array> {
  if (cachedFallbackSecret) return cachedFallbackSecret;
  const seed = process.env.DATABASE_URL;
  if (!seed) {
    throw new Error("AUTH_JWT_SECRET is missing or too short. Set a long random secret in .env.");
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seed));
  cachedFallbackSecret = new Uint8Array(digest);
  return cachedFallbackSecret;
}

async function getSecret(): Promise<Uint8Array> {
  const secret = process.env.AUTH_JWT_SECRET;
  if (secret && secret.length >= 32) {
    return new TextEncoder().encode(secret);
  }
  return getFallbackSecret();
}

export interface AccessTokenClaims {
  sub: string; // userId
  schoolId: string | null;
  role: UserRole;
}

export async function signAccessToken(claims: AccessTokenClaims): Promise<string> {
  return new SignJWT({ schoolId: claims.schoolId, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(await getSecret());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, await getSecret());
    if (!payload.sub || !payload.role) return null;
    return {
      sub: payload.sub,
      schoolId: (payload.schoolId as string | null) ?? null,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export const ACCESS_COOKIE_NAME = "sk_access";
export const REFRESH_COOKIE_NAME = "sk_refresh";

export const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: ACCESS_TOKEN_TTL_SECONDS,
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_SECONDS,
};

export const clearedCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
};
