import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { UniversitiesClient } from "./UniversitiesClient";

export default async function UniversitiesPage() {
  const user = await requireUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);

  return (
    <DashboardShell
      title="University Database"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <UniversitiesClient />
    </DashboardShell>
  );
}
