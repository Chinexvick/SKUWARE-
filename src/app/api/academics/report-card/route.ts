import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { letterGrade, remark } from "@/lib/academics/grading";

const STAFF_VIEW_ROLES = ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "TEACHER"];

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const studentId = req.nextUrl.searchParams.get("studentId");
  const termId = req.nextUrl.searchParams.get("termId");
  if (!studentId || !termId) {
    return NextResponse.json({ error: "studentId and termId are required." }, { status: 400 });
  }

  const term = await prisma.term.findFirst({ where: { id: termId, session: { schoolId: user.schoolId! } } });
  if (!term) return NextResponse.json({ error: "Term not found." }, { status: 404 });

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId! } });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  // Authorization: staff can view any student at their school (including
  // before publish, so they can review before releasing); a parent only
  // their linked children, and only once results are published; a student
  // only themself, same publish gate.
  if (STAFF_VIEW_ROLES.includes(user.role)) {
    // allowed
  } else if (user.role === "PARENT") {
    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
    const linked = parentProfile
      ? await prisma.studentParentLink.findFirst({ where: { parentId: parentProfile.id, studentId } })
      : null;
    if (!linked) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (!term.resultsPublished) {
      return NextResponse.json({ error: "Results for this term have not been published yet.", notPublished: true }, { status: 403 });
    }
  } else if (user.role === "STUDENT") {
    const studentProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
    if (studentProfile?.student?.id !== studentId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    if (!term.resultsPublished) {
      return NextResponse.json({ error: "Results for this term have not been published yet.", notPublished: true }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const components = await prisma.gradingComponent.findMany({ where: { schoolId: user.schoolId! } });
  const maxTotal = components.reduce((sum, c) => sum + c.maxScore, 0) || 1;

  // Everyone in the student's class+arm, to compute subject and overall class position.
  const classmates = await prisma.student.findMany({
    where: { classId: student.classId ?? "__none__", armId: student.armId ?? undefined },
    select: { id: true, firstName: true, lastName: true },
  });
  const classmateIds = classmates.map((c) => c.id);

  const [studentScores, allScores, subjectComments] = await Promise.all([
    prisma.score.findMany({ where: { studentId, termId }, include: { subject: true } }),
    prisma.score.findMany({ where: { studentId: { in: classmateIds }, termId } }),
    prisma.subjectComment.findMany({ where: { studentId, termId } }),
  ]);

  const subjectIds = Array.from(new Set(studentScores.map((s) => s.subjectId)));

  function totalFor(sid: string, subjectId: string): number {
    return allScores
      .filter((s) => s.studentId === sid && s.subjectId === subjectId)
      .reduce((sum, s) => sum + s.score, 0);
  }

  const subjects = subjectIds.map((subjectId) => {
    const subjectScores = studentScores.filter((s) => s.subjectId === subjectId);
    const total = subjectScores.reduce((sum, s) => sum + s.score, 0);
    const percentage = Math.round((total / maxTotal) * 1000) / 10;

    const ranked = classmateIds
      .map((sid) => ({ sid, total: totalFor(sid, subjectId) }))
      .sort((a, b) => b.total - a.total);
    const position = ranked.findIndex((r) => r.sid === studentId) + 1;

    return {
      subjectId,
      subjectName: subjectScores[0]?.subject.name ?? "",
      componentScores: subjectScores.map((s) => ({ componentId: s.componentId, score: s.score })),
      total,
      percentage,
      grade: letterGrade(percentage),
      remark: remark(letterGrade(percentage)),
      classPosition: position || null,
      classSize: classmateIds.length,
      comment: subjectComments.find((c) => c.subjectId === subjectId)?.comment ?? null,
    };
  });

  const overallPercentage =
    subjects.length > 0 ? Math.round((subjects.reduce((sum, s) => sum + s.percentage, 0) / subjects.length) * 10) / 10 : 0;

  return NextResponse.json({
    student: { id: student.id, firstName: student.firstName, lastName: student.lastName, admissionNo: student.admissionNo },
    term: { id: term.id, name: term.name, resultsPublished: term.resultsPublished },
    components,
    subjects,
    overallPercentage,
    overallGrade: subjects.length > 0 ? letterGrade(overallPercentage) : null,
  });
}
