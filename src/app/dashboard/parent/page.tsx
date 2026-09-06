import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";

export default async function ParentDashboardPage() {
  const user = await requireUser(["PARENT"]);

  return (
    <DashboardShell
      title="Parent Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Outstanding Balance" value="₦0" />
        <StatCard label="Attendance This Term" value="—" />
        <StatCard label="Unread Messages" value={0} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Once a child is linked to your account, their results, attendance, fees and announcements
        will appear here.
      </p>
    </DashboardShell>
  );
}
