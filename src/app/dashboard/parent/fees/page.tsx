import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function ParentFeesPage() {
  const user = await requireUser(["PARENT"]);

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: { childLinks: { include: { student: true } } },
  });
  const childIds = parentProfile?.childLinks.map((l) => l.studentId) ?? [];

  const invoices = childIds.length
    ? await prisma.invoice.findMany({
        where: { studentId: { in: childIds } },
        include: { student: true, payments: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  const outstanding = invoices.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

  return (
    <DashboardShell
      title="Fees"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="mb-6 inline-flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Outstanding</span>
        <span className="text-2xl font-bold text-black">₦{outstanding.toLocaleString()}</span>
      </Card>

      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500">No invoices yet.</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Child</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {inv.student.firstName} {inv.student.lastName}
                  </td>
                  <td className="px-4 py-3">{inv.description}</td>
                  <td className="px-4 py-3">₦{inv.amountDue.toLocaleString()}</td>
                  <td className="px-4 py-3">₦{inv.amountPaid.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <p className="mt-6 max-w-xl text-xs text-gray-500">
        Online card/bank-transfer payment isn&apos;t connected yet — pay through your school&apos;s usual bank
        transfer or POS channel and the bursar will record it here. Once a payment gateway (e.g. Paystack or
        Flutterwave) is configured, you&apos;ll be able to pay directly from this page.
      </p>
    </DashboardShell>
  );
}
