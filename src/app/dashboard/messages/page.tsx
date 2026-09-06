import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MessagesHub } from "./MessagesHub";

const ADMIN_ROLES = ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"];

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell
      title="Messages"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <MessagesHub canCreateCommunity={ADMIN_ROLES.includes(user.role)} />
    </DashboardShell>
  );
}
