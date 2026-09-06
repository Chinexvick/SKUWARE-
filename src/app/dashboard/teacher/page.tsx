import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { StatCard } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function TeacherDashboardPage() {
  const user = await requireUser(["SUPER_ADMIN", "TEACHER"]);

  const staffProfile = await prisma.staffProfile.findUnique({ where: { userId: user.id } });

  const [assignments, classAssignmentCount] = await Promise.all([
    prisma.assignment.findMany({
      where: { createdById: user.id },
      include: { submissions: true },
    }),
    staffProfile ? prisma.teacherSubjectAssignment.count({ where: { teacherId: staffProfile.id } }) : Promise.resolve(0),
  ]);

  const now = new Date();
  const assignmentsDue = assignments.filter((a) => a.dueDate >= now).length;
  const pendingGrading = assignments.reduce((sum, a) => sum + a.submissions.filter((s) => !s.grade).length, 0);

  const classIds = staffProfile
    ? (await prisma.teacherSubjectAssignment.findMany({ where: { teacherId: staffProfile.id }, select: { classId: true } })).map(
        (a) => a.classId,
      )
    : [];
  const studentCount = classIds.length > 0 ? await prisma.student.count({ where: { classId: { in: classIds } } }) : 0;

  return (
    <DashboardShell
      title="Teacher Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Classes Assigned" value={classAssignmentCount} />
        <StatCard label="Pending Grading" value={pendingGrading} accent={pendingGrading > 0 ? "brand" : "neutral"} />
        <StatCard label="Assignments Due" value={assignmentsDue} />
        <StatCard label="Students" value={studentCount} />
      </div>
      <p className="mt-8 max-w-2xl text-sm text-gray-500">
        Take attendance, enter scores, and create assignments from the sidebar. The AI teaching assistant can draft
        lesson plans and quizzes for you.
      </p>
    </DashboardShell>
  );
}
