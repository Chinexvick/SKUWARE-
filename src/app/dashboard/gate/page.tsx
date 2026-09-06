import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { GateScanClient } from "./GateScanClient";

export default async function GateDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "GATE_STAFF"]);

  return (
    <DashboardShell
      title="Gate Access"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <GateScanClient />
    </DashboardShell>
  );
}
