import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ChatPanel } from "@/components/ai/ChatPanel";

export default async function AITutorPage() {
  const user = await requireUser(["STUDENT"]);

  return (
    <DashboardShell
      title="AI Academic Tutor"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ChatPanel
        persona="STUDENT_TUTOR"
        title="Ask your AI tutor anything"
        placeholder="e.g. Explain quadratic equations"
        suggestions={["Explain photosynthesis", "Give me 5 practice questions on algebra", "Why is my answer wrong?"]}
      />
    </DashboardShell>
  );
}
