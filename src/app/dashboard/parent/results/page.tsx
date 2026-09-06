import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { prisma } from "@/lib/db";
import { ParentResultsClient } from "./ParentResultsClient";

export default async function ParentResultsPage() {
  const user = await requireUser(["PARENT"]);

  const parentProfile = await prisma.parentProfile.findUnique({
    where: { userId: user.id },
    include: { childLinks: { include: { student: true } } },
  });

  const children = (parentProfile?.childLinks ?? []).map((l) => ({
    id: l.student.id,
    name: `${l.student.firstName} ${l.student.lastName}`,
  }));

  return (
    <DashboardShell
      title="Results"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      {children.length === 0 ? (
        <p className="text-sm text-gray-500">No children are linked to your account yet.</p>
      ) : (
        <ParentResultsClient kids={children} />
      )}
    </DashboardShell>
  );
}
