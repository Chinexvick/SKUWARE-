import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ExamPrepClient } from "./ExamPrepClient";

export default async function ExamPrepPage() {
  const user = await requireUser(["STUDENT"]);

  return (
    <DashboardShell
      title="Exam Prep"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ExamPrepClient />
    </DashboardShell>
  );
}
