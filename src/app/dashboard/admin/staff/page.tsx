import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StaffClient } from "./StaffClient";

export default async function StaffPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "STAFF"]);
  const canEdit = ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL"].includes(user.role);

  return (
    <DashboardShell
      title="Staff"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <StaffClient canEdit={canEdit} />
    </DashboardShell>
  );
}
