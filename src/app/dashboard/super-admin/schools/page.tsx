import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function SuperAdminSchoolsPage() {
  const user = await requireUser(["SUPER_ADMIN"]);

  const schools = await prisma.school.findMany({
    include: { _count: { select: { users: true, students: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <DashboardShell
      title="Schools"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">School</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Users</th>
              <th className="px-4 py-3">Students</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schools.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-black">{s.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{s.status}</span>
                </td>
                <td className="px-4 py-3">{s.planTier}</td>
                <td className="px-4 py-3">{s._count.users}</td>
                <td className="px-4 py-3">{s._count.students}</td>
                <td className="px-4 py-3">{s.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </DashboardShell>
  );
}
