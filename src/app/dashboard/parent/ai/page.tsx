import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ChatPanel } from "@/components/ai/ChatPanel";

export default async function ParentAIPage() {
  const user = await requireUser(["PARENT"]);

  return (
    <DashboardShell
      title="AI Family Assistant"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ChatPanel
        persona="PARENT_ASSISTANT"
        title="Ask about your child's progress"
        placeholder="e.g. How is my child performing this term?"
        suggestions={["How is my child performing?", "What should my child focus on this week?", "Has attendance improved?"]}
      />
    </DashboardShell>
  );
}
