import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { QuestionsClient } from "./QuestionsClient";

export default async function QuestionBankPage() {
  const user = await requireUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);

  return (
    <DashboardShell
      title="Question Bank"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <QuestionsClient />
    </DashboardShell>
  );
}
