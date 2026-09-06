import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ROLE_DASHBOARD_PATH } from "@/lib/auth/rbac";

/** Server-component guard: redirects to login (or the user's own dashboard) if unauthorized. */
export async function requireUser(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (!allowedRoles.includes(user.role)) {
    redirect(ROLE_DASHBOARD_PATH[user.role]);
  }
  return user;
}
