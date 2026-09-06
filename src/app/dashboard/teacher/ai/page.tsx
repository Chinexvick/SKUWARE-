import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ChatPanel } from "@/components/ai/ChatPanel";

export default async function TeacherAIPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  return (
    <DashboardShell
      title="AI Teaching Assistant"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ChatPanel
        persona="TEACHER_ASSISTANT"
        title="Ask your AI teaching assistant"
        placeholder="e.g. Create a lesson plan on photosynthesis for SS2"
        suggestions={["Generate a 10-question quiz on quadratic equations", "Draft a lesson plan on the Nigerian civil war", "Give me revision questions on cell biology"]}
      />
    </DashboardShell>
  );
}
