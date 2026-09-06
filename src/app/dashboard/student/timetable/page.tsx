import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export default async function TimetablePage() {
  const user = await requireUser(["STUDENT"]);

  return (
    <DashboardShell
      title="Timetable"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="mx-auto max-w-md text-center text-sm text-gray-500">
        Period-by-period timetable scheduling hasn&apos;t been built yet — it&apos;s next in line after the
        modules already shipped. Your subjects and teachers already show up under Academics once your school sets
        them up.
      </Card>
    </DashboardShell>
  );
}
