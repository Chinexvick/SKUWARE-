import { Suspense } from "react";
import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { GradingClient } from "./GradingClient";

export default async function GradingPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  return (
    <DashboardShell
      title="Grading"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
        <GradingClient />
      </Suspense>
    </DashboardShell>
  );
}
