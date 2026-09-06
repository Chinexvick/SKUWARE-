import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const SALT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// Minimum bar: 10+ chars, upper, lower, digit. Rejects the most common weak patterns.
// Not a substitute for a breached-password check, but a reasonable floor for launch.
const COMMON_PASSWORDS = new Set([
  "password", "password1", "12345678", "123456789", "qwertyui",
  "letmein1", "admin123", "welcome1", "passw0rd", "iloveyou",
]);

/** Generates a random password that satisfies assessPasswordStrength, for staff/parent invites. */
export function generateTemporaryPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  // Guarantee the character classes the strength check requires.
  return `${out}Aa1`;
}

export function assessPasswordStrength(password: string): { ok: boolean; reason?: string } {
  if (password.length < 10) return { ok: false, reason: "Password must be at least 10 characters." };
  if (password.length > 128) return { ok: false, reason: "Password is too long." };
  if (!/[a-z]/.test(password)) return { ok: false, reason: "Include at least one lowercase letter." };
  if (!/[A-Z]/.test(password)) return { ok: false, reason: "Include at least one uppercase letter." };
  if (!/[0-9]/.test(password)) return { ok: false, reason: "Include at least one number." };
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { ok: false, reason: "This password is too common. Choose something less predictable." };
  }
  return { ok: true };
}
