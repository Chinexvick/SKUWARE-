import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TeacherClassesClient } from "./TeacherClassesClient";

export default async function TeacherClassesPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  return (
    <DashboardShell
      title="My Classes"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <TeacherClassesClient />
    </DashboardShell>
  );
}
