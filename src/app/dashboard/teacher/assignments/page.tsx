import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { TeacherAssignmentsClient } from "./TeacherAssignmentsClient";

export default async function TeacherAssignmentsPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  return (
    <DashboardShell
      title="Assignments"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <TeacherAssignmentsClient />
    </DashboardShell>
  );
}
