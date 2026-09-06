import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";

export default async function SuperAdminBillingPage() {
  const user = await requireUser(["SUPER_ADMIN"]);

  return (
    <DashboardShell
      title="Billing"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="mx-auto max-w-md text-center text-sm text-gray-500">
        Platform subscription billing (plan tiers, invoicing schools, dunning) isn&apos;t built yet — schools
        currently sign up on a trial plan tier with no billing enforcement. This connects once a subscription
        billing provider is chosen.
      </Card>
    </DashboardShell>
  );
}
