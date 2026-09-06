import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";
import { notifyUsers } from "@/lib/notifications";

const bodySchema = z.object({ publish: z.boolean() });

/**
 * Publishing a term's results is the gate between "teachers have entered
 * scores" and "parents/students can actually see them" — report cards are
 * always computed live from Score rows, but /api/academics/report-card
 * refuses to show them to a parent/student until this flag is set.
 */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const { id } = await params;

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input." }, { status: 400 });

  const term = await prisma.term.findFirst({ where: { id, session: { schoolId: user.schoolId! } } });
  if (!term) return NextResponse.json({ error: "Term not found." }, { status: 404 });

  const updated = await prisma.term.update({
    where: { id },
    data: {
      resultsPublished: parsed.data.publish,
      resultsPublishedAt: parsed.data.publish ? new Date() : null,
    },
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_UPDATED",
    targetType: "Term",
    targetId: term.id,
    metadata: { resultsPublished: parsed.data.publish },
  });

  if (parsed.data.publish) {
    const scoredStudentIds = await prisma.score
      .findMany({ where: { termId: id, schoolId: user.schoolId! }, select: { studentId: true }, distinct: ["studentId"] })
      .then((rows) => rows.map((r) => r.studentId));

    if (scoredStudentIds.length > 0) {
      const students = await prisma.student.findMany({
        where: { id: { in: scoredStudentIds } },
        include: { parentLinks: { include: { parent: true } } },
      });
      const recipientUserIds = new Set<string>();
      const studentProfileIds = students.map((s) => s.userId).filter((v): v is string => !!v);
      if (studentProfileIds.length > 0) {
        const profiles = await prisma.studentProfile.findMany({ where: { id: { in: studentProfileIds } }, select: { userId: true } });
        profiles.forEach((p) => recipientUserIds.add(p.userId));
      }
      students.forEach((s) => s.parentLinks.forEach((l) => recipientUserIds.add(l.parent.userId)));

      await notifyUsers(Array.from(recipientUserIds), {
        title: `Results published: ${term.name}`,
        body: "Report cards for this term are now available to view.",
        link: "/dashboard",
      });
    }
  }

  return NextResponse.json({ term: updated });
}
