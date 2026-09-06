import type { UserRole } from "@prisma/client";

/** Where an authenticated user of each role lands after login. */
export const ROLE_DASHBOARD_PATH: Record<UserRole, string> = {
  SUPER_ADMIN: "/dashboard/super-admin",
  CONTENT_MANAGER: "/dashboard/content-manager",
  SCHOOL_OWNER: "/dashboard/admin",
  PRINCIPAL: "/dashboard/admin",
  VICE_PRINCIPAL: "/dashboard/admin",
  BURSAR: "/dashboard/bursar",
  TEACHER: "/dashboard/teacher",
  STAFF: "/dashboard/admin",
  PARENT: "/dashboard/parent",
  STUDENT: "/dashboard/student",
  GATE_STAFF: "/dashboard/gate",
};

/** Which role groups may access which dashboard path prefix. Checked in middleware. */
export const DASHBOARD_ACCESS: Record<string, UserRole[]> = {
  "/dashboard/super-admin": ["SUPER_ADMIN"],
  "/dashboard/content-manager": ["SUPER_ADMIN", "CONTENT_MANAGER"],
  "/dashboard/admin": ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "STAFF"],
  "/dashboard/bursar": ["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"],
  "/dashboard/teacher": ["SUPER_ADMIN", "TEACHER"],
  "/dashboard/parent": ["PARENT"],
  "/dashboard/student": ["STUDENT"],
  "/dashboard/gate": ["SUPER_ADMIN", "SCHOOL_OWNER", "GATE_STAFF"],
};

export function isRoleAllowed(pathPrefix: string, role: UserRole): boolean {
  const allowed = DASHBOARD_ACCESS[pathPrefix];
  if (!allowed) return false;
  return allowed.includes(role);
}

/** Roles that belong to a specific school tenant (everyone except platform staff). */
export const TENANT_ROLES: UserRole[] = [
  "SCHOOL_OWNER",
  "PRINCIPAL",
  "VICE_PRINCIPAL",
  "BURSAR",
  "TEACHER",
  "STAFF",
  "PARENT",
  "STUDENT",
  "GATE_STAFF",
];

export const PLATFORM_ROLES: UserRole[] = ["SUPER_ADMIN", "CONTENT_MANAGER"];
