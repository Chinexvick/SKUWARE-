import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function ParentDashboardPage() {
  const user = await requireUser(["PARENT"]);

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: { childLinks: { include: { student: true } } },
  });
  const childIds = parentProfile?.childLinks.map((l) => l.studentId) ?? [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [invoiceTotals, attendanceRecords, unreadMessages] = await Promise.all([
    childIds.length > 0
      ? prisma.invoice.aggregate({ where: { studentId: { in: childIds } }, _sum: { amountDue: true, amountPaid: true } })
      : Promise.resolve({ _sum: { amountDue: 0, amountPaid: 0 } }),
    childIds.length > 0
      ? prisma.attendance.findMany({ where: { studentId: { in: childIds }, date: { gte: thirtyDaysAgo } }, select: { status: true } })
      : Promise.resolve([]),
    prisma.message.count({ where: { recipientId: user.id, readAt: null } }),
  ]);
  const outstanding = Math.max(0, (invoiceTotals._sum.amountDue ?? 0) - (invoiceTotals._sum.amountPaid ?? 0));
  const attendanceRate =
    attendanceRecords.length > 0
      ? Math.round((attendanceRecords.filter((a) => a.status === "PRESENT").length / attendanceRecords.length) * 100)
      : null;

  return (
    <DashboardShell
      title="Parent Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Outstanding Balance"
          value={`₦${outstanding.toLocaleString("en-NG")}`}
          accent={outstanding > 0 ? "negative" : "positive"}
        />
        <StatCard label="Attendance (30 days)" value={attendanceRate !== null ? `${attendanceRate}%` : "—"} />
        <StatCard label="Unread Messages" value={unreadMessages} accent={unreadMessages > 0 ? "brand" : "neutral"} />
      </div>
      {childIds.length === 0 ? (
        <p className="mt-8 max-w-2xl text-sm text-gray-500">
          Once a child is linked to your account, their results, attendance, fees and announcements will appear
          here.
        </p>
      ) : (
        <p className="mt-8 max-w-2xl text-sm text-gray-500">
          Linked children: {parentProfile!.childLinks.map((l) => `${l.student.firstName} ${l.student.lastName}`).join(", ")}
        </p>
      )}
    </DashboardShell>
  );
}
