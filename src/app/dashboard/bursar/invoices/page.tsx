import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { InvoicesClient } from "./InvoicesClient";

export default async function BursarInvoicesPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"]);

  return (
    <DashboardShell
      title="Invoices"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <InvoicesClient />
    </DashboardShell>
  );
}
