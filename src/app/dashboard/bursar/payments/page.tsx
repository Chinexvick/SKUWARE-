import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function BursarPaymentsPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "BURSAR"]);

  const payments = await prisma.payment.findMany({
    where: { schoolId: user.schoolId! },
    include: { invoice: { include: { student: true } }, recordedBy: { select: { firstName: true, lastName: true } } },
    orderBy: { paidAt: "desc" },
    take: 100,
  });

  return (
    <DashboardShell
      title="Payments"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Recorded By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No payments recorded yet.</td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{p.paidAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-black">
                    {p.invoice.student.lastName} {p.invoice.student.firstName}
                  </td>
                  <td className="px-4 py-3">₦{p.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{p.method.replace("_", " ")}</td>
                  <td className="px-4 py-3">{p.recordedBy ? `${p.recordedBy.firstName} ${p.recordedBy.lastName}` : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
