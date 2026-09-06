import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"]);

  return (
    <DashboardShell
      title="Analytics"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <AnalyticsClient />
    </DashboardShell>
  );
}
