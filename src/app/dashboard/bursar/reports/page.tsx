import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function BursarReportsPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"]);
  const schoolId = user.schoolId!;

  const invoices = await prisma.invoice.findMany({ where: { schoolId } });
  const totalDue = invoices.reduce((sum, i) => sum + i.amountDue, 0);
  const totalPaid = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = totalDue - totalPaid;
  const overdueCount = invoices.filter((i) => i.status !== "PAID" && i.dueDate && i.dueDate < new Date()).length;

  const paymentsByMethod = await prisma.payment.groupBy({
    by: ["method"],
    where: { schoolId },
    _sum: { amount: true },
  });

  return (
    <DashboardShell
      title="Financial Reports"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Expected" value={`₦${totalDue.toLocaleString()}`} />
        <StatCard label="Total Collected" value={`₦${totalPaid.toLocaleString()}`} />
        <StatCard label="Outstanding" value={`₦${outstanding.toLocaleString()}`} />
        <StatCard label="Overdue Invoices" value={overdueCount} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Collections by Method</h2>
        {paymentsByMethod.length === 0 ? (
          <p className="text-sm text-gray-500">No payments recorded yet.</p>
        ) : (
          <ul className="max-w-md divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white">
            {paymentsByMethod.map((p) => (
              <li key={p.method} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="font-medium text-black">{p.method.replace("_", " ")}</span>
                <span>₦{(p._sum.amount ?? 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardShell>
  );
}
