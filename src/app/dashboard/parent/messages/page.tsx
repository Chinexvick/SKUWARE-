import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MessagesClient } from "./MessagesClient";

export default async function ParentMessagesPage() {
  const user = await requireUser(["PARENT"]);

  return (
    <DashboardShell
      title="Messages"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <MessagesClient />
    </DashboardShell>
  );
}
