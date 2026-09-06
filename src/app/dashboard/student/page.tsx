import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export default async function StudentDashboardPage() {
  const user = await requireUser(["STUDENT"]);

  return (
    <DashboardShell
      title="My Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold text-gray-500">Today&apos;s Timetable</h2>
          <p className="mt-2 text-sm text-gray-500">No classes scheduled yet.</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-gray-500">Assignments Due</h2>
          <p className="mt-2 text-sm text-gray-500">You&apos;re all caught up.</p>
        </Card>
        <Card className="border-2 border-brand-yellow">
          <h2 className="text-sm font-semibold text-black">AI Academic Tutor</h2>
          <p className="mt-2 text-sm text-gray-500">
            JAMB / WAEC / NECO exam prep and personal AI tutoring launch here.
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
