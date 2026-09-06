import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function AdminDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "STAFF"]);

  const schoolId = user.schoolId!;
  const [studentCount, staffCount, parentCount, recentAnnouncements, invoiceTotals] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.staffProfile.count({ where: { schoolId } }),
    prisma.parentProfile.count({ where: { schoolId } }),
    prisma.announcement.findMany({
      where: { schoolId },
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
    prisma.invoice.aggregate({ where: { schoolId }, _sum: { amountDue: true, amountPaid: true } }),
  ]);
  const outstanding = Math.max(0, (invoiceTotals._sum.amountDue ?? 0) - (invoiceTotals._sum.amountPaid ?? 0));

  return (
    <DashboardShell
      title="School Overview"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Students" value={studentCount} />
        <StatCard label="Staff" value={staffCount} />
        <StatCard label="Parents" value={parentCount} />
        <StatCard
          label="Outstanding Fees"
          value={`₦${outstanding.toLocaleString("en-NG")}`}
          accent={outstanding > 0 ? "negative" : "positive"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Recent Announcements
          </h2>
          {recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-500">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentAnnouncements.map((a) => (
                <li key={a.id} className="py-3">
                  <p className="text-sm font-semibold text-black">{a.title}</p>
                  <p className="text-xs text-gray-500">{a.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-black p-5 text-white shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-300">
            Quick Actions
          </h2>
          <p className="text-sm text-gray-300">
            Student, staff, academics, and fee management modules connect here as the platform
            build-out continues.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
