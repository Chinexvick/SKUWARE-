import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function ContentManagerDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);

  const [inReview, published, universities, flagged] = await Promise.all([
    prisma.question.count({ where: { reviewStatus: "DRAFT" } }),
    prisma.question.count({ where: { reviewStatus: "APPROVED" } }),
    prisma.university.count(),
    prisma.question.count({ where: { reviewStatus: "FLAGGED" } }),
  ]);

  return (
    <DashboardShell
      title="Content Management"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Questions in Review" value={inReview} accent={inReview > 0 ? "brand" : "neutral"} />
        <StatCard label="Published Questions" value={published} accent="positive" />
        <StatCard label="Universities Tracked" value={universities} />
        <StatCard label="Flagged Questions" value={flagged} accent={flagged > 0 ? "negative" : "neutral"} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Head to Review Queue to approve or flag AI-generated questions, or Question Bank / University DB to manage
        content directly.
      </p>
    </DashboardShell>
  );
}
