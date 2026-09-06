import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ReportCardView } from "@/components/academics/ReportCardView";
import { prisma } from "@/lib/db";

export default async function StudentResultsPage() {
  const user = await requireUser(["STUDENT"]);

  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });

  return (
    <DashboardShell
      title="My Results"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      {profile?.student ? (
        <ReportCardView studentId={profile.student.id} />
      ) : (
        <p className="text-sm text-gray-500">
          Your account is not yet linked to a student record. Contact your school administrator.
        </p>
      )}
    </DashboardShell>
  );
}
