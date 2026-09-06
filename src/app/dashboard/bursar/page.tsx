import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function BursarDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"]);
  const schoolId = user.schoolId!;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [invoiceTotals, transactionsToday, refundsIssued] = await Promise.all([
    prisma.invoice.aggregate({ where: { schoolId }, _sum: { amountDue: true, amountPaid: true } }),
    prisma.payment.count({ where: { schoolId, paidAt: { gte: startOfToday } } }),
    prisma.payment.count({ where: { schoolId, status: "REFUNDED" } }),
  ]);
  const collected = invoiceTotals._sum.amountPaid ?? 0;
  const outstanding = Math.max(0, (invoiceTotals._sum.amountDue ?? 0) - collected);

  return (
    <DashboardShell
      title="Finance Overview"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Fees Collected" value={`₦${collected.toLocaleString("en-NG")}`} accent="positive" />
        <StatCard label="Outstanding" value={`₦${outstanding.toLocaleString("en-NG")}`} accent={outstanding > 0 ? "negative" : "positive"} />
        <StatCard label="Transactions Today" value={transactionsToday} />
        <StatCard label="Refunds Issued" value={refundsIssued} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Head to Invoices to record payments, or Fees &amp; Finance (School Owner) to set up fee structures and
        generate invoices for a class.
      </p>
    </DashboardShell>
  );
}
