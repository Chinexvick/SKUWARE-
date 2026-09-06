import { randomBytes, createHash } from "crypto";

// Node-only (uses Node "crypto") — never import this from middleware/edge code.

/** Opaque refresh token: random bytes returned to the client, SHA-256 hash stored server-side. */
export function generateRefreshToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = randomBytes(48).toString("base64url");
  const tokenHash = hashRefreshToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
