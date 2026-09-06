import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StudentAssignmentsClient } from "./StudentAssignmentsClient";

export default async function StudentAssignmentsPage() {
  const user = await requireUser(["STUDENT"]);

  return (
    <DashboardShell
      title="Assignments"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <StudentAssignmentsClient />
    </DashboardShell>
  );
}
