import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";

export default async function TeacherDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  return (
    <DashboardShell
      title="Teacher Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes Today" value={0} />
        <StatCard label="Pending Grading" value={0} />
        <StatCard label="Assignments Due" value={0} />
        <StatCard label="Students" value={0} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Class rosters, attendance-taking, grading and the AI lesson-planning assistant connect
        here as the teacher application is built out.
      </p>
    </DashboardShell>
  );
}
