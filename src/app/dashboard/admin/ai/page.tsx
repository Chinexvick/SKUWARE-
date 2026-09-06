import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ChatPanel } from "@/components/ai/ChatPanel";

export default async function SchoolAssistantPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"]);

  return (
    <DashboardShell
      title="AI School Assistant"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ChatPanel
        persona="SCHOOL_ASSISTANT"
        title="Ask about your school's real, current data"
        placeholder="e.g. Which class has the lowest average?"
        suggestions={[
          "How much fees are outstanding right now?",
          "Which class has the lowest average this term?",
          "Which students have poor attendance?",
          "How many students enrolled this month?",
        ]}
      />
    </DashboardShell>
  );
}
