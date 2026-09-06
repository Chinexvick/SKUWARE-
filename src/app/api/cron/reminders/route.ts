import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { notifyUsers } from "@/lib/notifications";

/**
 * Runs once a day via Vercel Cron (see vercel.json) — the actual automated
 * reminder engine: unpaid overdue fees and unsubmitted overdue assignments
 * generate a fresh in-app notification for the affected parents/students
 * without a human having to remember to chase anyone.
 *
 * Protected by CRON_SECRET when that env var is set (Vercel sends it as a
 * Bearer token automatically for scheduled invocations); if it's not
 * configured yet, the route still runs rather than silently doing nothing —
 * consistent with how this deployment has had to work around Vercel
 * dashboard env var limitations elsewhere.
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (expected) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${expected}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // --- Overdue, unpaid fee reminders ---
  const overdueInvoices = await prisma.invoice.findMany({
    where: { status: { in: ["PENDING", "PARTIALLY_PAID"] }, dueDate: { lt: today } },
    include: { student: { include: { parentLinks: { include: { parent: true } } } } },
  });

  let feeRemindersSent = 0;
  for (const invoice of overdueInvoices) {
    const outstanding = invoice.amountDue - invoice.amountPaid;
    if (outstanding <= 0) continue;
    const recipientIds = new Set<string>();
    if (invoice.student.userId) {
      const profile = await prisma.studentProfile.findUnique({ where: { id: invoice.student.userId } });
      if (profile) recipientIds.add(profile.userId);
    }
    invoice.student.parentLinks.forEach((l) => recipientIds.add(l.parent.userId));
    if (recipientIds.size === 0) continue;

    await notifyUsers(Array.from(recipientIds), {
      title: "Fee payment reminder",
      body: `${invoice.description} for ${invoice.student.firstName} ${invoice.student.lastName} is overdue — ₦${outstanding.toLocaleString("en-NG")} outstanding.`,
      link: "/dashboard/parent/fees",
    });
    feeRemindersSent += 1;
  }

  // --- Overdue, unsubmitted assignment reminders ---
  const overdueAssignments = await prisma.assignment.findMany({
    where: { dueDate: { lt: today } },
    include: { submissions: true },
  });

  let assignmentRemindersSent = 0;
  for (const assignment of overdueAssignments) {
    const submittedStudentIds = new Set(assignment.submissions.map((s) => s.studentId));
    const students = await prisma.student.findMany({
      where: {
        schoolId: assignment.schoolId,
        classId: assignment.classId,
        ...(assignment.armId ? { armId: assignment.armId } : {}),
        id: { notIn: Array.from(submittedStudentIds) },
      },
      select: { userId: true },
    });
    const studentProfileIds = students.map((s) => s.userId).filter((v): v is string => !!v);
    if (studentProfileIds.length === 0) continue;
    const profiles = await prisma.studentProfile.findMany({ where: { id: { in: studentProfileIds } }, select: { userId: true } });
    if (profiles.length === 0) continue;

    await notifyUsers(profiles.map((p) => p.userId), {
      title: "Assignment reminder",
      body: `"${assignment.title}" was due ${assignment.dueDate.toLocaleDateString()} and you haven't submitted it yet.`,
      link: "/dashboard/student/assignments",
    });
    assignmentRemindersSent += 1;
  }

  return NextResponse.json({ feeRemindersSent, assignmentRemindersSent });
}
