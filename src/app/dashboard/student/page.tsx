import Link from "next/link";
import { requireUser } from "@/lib/auth/guard";
import { NAV_ITEMS, ROLE_LABEL } from "@/lib/nav";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { Greeting } from "@/components/layout/Greeting";
import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db";

export default async function StudentDashboardPage() {
  const user = await requireUser(["STUDENT"]);

  const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
  const student = studentProfile?.student;

  const upcomingAssignments = student
    ? await prisma.assignment.findMany({
        where: {
          classId: student.classId ?? "__none__",
          OR: [{ armId: null }, { armId: student.armId }],
          dueDate: { gte: new Date() },
        },
        include: { subject: true, submissions: { where: { studentId: student.id } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      })
    : [];
  const pendingAssignments = upcomingAssignments.filter((a) => a.submissions.length === 0);

  return (
    <DashboardShell
      title="My Dashboard"
      roleLabel={ROLE_LABEL[user.role]}
      userName={`${user.firstName} ${user.lastName}`}
      navItems={NAV_ITEMS[user.role]}
    >
      <Greeting firstName={user.firstName} />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold text-gray-500">Timetable</h2>
          <p className="mt-2 text-sm text-gray-500">Period-by-period timetabling isn&apos;t built yet.</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-gray-500">Assignments Due</h2>
          {pendingAssignments.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">You&apos;re all caught up.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {pendingAssignments.map((a) => (
                <li key={a.id} className="text-sm text-black">
                  <span className="font-medium">{a.subject.name}:</span> {a.title} — due{" "}
                  {new Date(a.dueDate).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Link href="/dashboard/student/ai-tutor">
          <Card interactive className="h-full border-2 border-brand-yellow">
            <h2 className="text-sm font-semibold text-black">AI Academic Tutor</h2>
            <p className="mt-2 text-sm text-gray-500">
              Get help on any topic, practice questions, and JAMB/WAEC/NECO exam prep.
            </p>
          </Card>
        </Link>
      </div>
    </DashboardShell>
  );
}
