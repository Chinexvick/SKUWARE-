import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";

export default async function ContentManagerDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);

  return (
    <DashboardShell
      title="Content Management"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Questions in Review" value={0} />
        <StatCard label="Published Questions" value={0} />
        <StatCard label="Universities Tracked" value={0} />
        <StatCard label="Content Reports Open" value={0} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        The question bank, university database and AI-content review/approval workflow connect
        here.
      </p>
    </DashboardShell>
  );
}
