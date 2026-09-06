import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function SuperAdminDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN"]);

  const [schoolCount, userCount, trialCount] = await Promise.all([
    prisma.school.count(),
    prisma.user.count(),
    prisma.school.count({ where: { status: "TRIAL" } }),
  ]);

  return (
    <DashboardShell
      title="Platform Overview"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Schools" value={schoolCount} />
        <StatCard label="Trial Schools" value={trialCount} />
        <StatCard label="Total Users" value={userCount} />
        <StatCard label="Active Incidents" value={0} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Tenant provisioning, billing operations and platform-wide audit review connect here.
      </p>
    </DashboardShell>
  );
}
