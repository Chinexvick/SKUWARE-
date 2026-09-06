import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * Server-side guard for API route handlers. Returns either an authorized
 * user (tenant-scoped unless the role is platform-level) or a ready-to-return
 * NextResponse for the caller to short-circuit with.
 */
export async function requireApiUser(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Not authenticated." }, { status: 401 }) };
  }
  if (!allowedRoles.includes(user.role)) {
    return { user: null, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { user, response: null };
}

export const ADMIN_ROLES: UserRole[] = ["SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"];
export const ADMIN_AND_STAFF_ROLES: UserRole[] = [...ADMIN_ROLES, "STAFF"];
