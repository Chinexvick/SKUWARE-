import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { AttendanceHistory } from "@/components/academics/AttendanceHistory";
import { prisma } from "@/lib/db";

export default async function StudentAttendancePage() {
  const user = await requireUser(["STUDENT"]);
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });

  return (
    <DashboardShell
      title="My Attendance"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      {profile?.student ? (
        <AttendanceHistory studentId={profile.student.id} />
      ) : (
        <p className="text-sm text-gray-500">Your account is not yet linked to a student record.</p>
      )}
    </DashboardShell>
  );
}
