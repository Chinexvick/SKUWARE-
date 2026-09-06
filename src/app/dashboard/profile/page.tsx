import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <DashboardShell
      title="My Profile"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <ProfileClient
        firstName={user.firstName}
        lastName={user.lastName}
        email={user.email}
        phone={user.phone}
        roleLabel={ROLE_LABEL[user.role]}
        avatarUrl={user.avatarUrl}
      />
    </DashboardShell>
  );
}
