import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { FeeStructuresClient } from "./FeeStructuresClient";

export default async function FinancePage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER"]);

  return (
    <DashboardShell
      title="Fees & Finance"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <FeeStructuresClient />
    </DashboardShell>
  );
}
