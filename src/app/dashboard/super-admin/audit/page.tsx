import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function SuperAdminAuditPage() {
  const user = await requireUser(["SUPER_ADMIN"]);

  const logs = await prisma.auditLog.findMany({
    include: { school: { select: { name: true } }, user: { select: { firstName: true, lastName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <DashboardShell
      title="Audit Logs"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="px-4 py-3 text-xs text-gray-500">{l.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-black">{l.action.replace(/_/g, " ")}</td>
                <td className="px-4 py-3">{l.user ? `${l.user.firstName} ${l.user.lastName}` : "—"}</td>
                <td className="px-4 py-3">{l.school?.name ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{l.targetType ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
