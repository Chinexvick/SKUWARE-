import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";

export default async function BursarDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"]);

  return (
    <DashboardShell
      title="Finance Overview"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fees Collected" value="₦0" hint="This term" />
        <StatCard label="Outstanding" value="₦0" />
        <StatCard label="Transactions Today" value={0} />
        <StatCard label="Refunds Pending" value={0} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Invoice generation, online payment collection, receipts and reconciliation reporting
        connect here once the fees module is built.
      </p>
    </DashboardShell>
  );
}
