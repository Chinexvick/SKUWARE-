import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export default async function GateDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "GATE_STAFF"]);

  return (
    <DashboardShell
      title="Gate Access"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="mx-auto max-w-md text-center">
        <h2 className="text-sm font-semibold text-gray-500">Scan Student Credential</h2>
        <div className="my-8 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400">
          QR / barcode scanner connects here
        </div>
        <p className="text-xs text-gray-500">
          PIN entry and credential verification will be wired up with the gate-access module.
        </p>
      </Card>
    </DashboardShell>
  );
}
