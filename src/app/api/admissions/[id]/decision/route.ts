import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { admissionDecisionSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const { id } = await params;
  const schoolId = user.schoolId!;

  const application = await prisma.admissionApplication.findFirst({ where: { id, schoolId } });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = admissionDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { status, notes, classId, admissionNo } = parsed.data;

  if (status === "APPROVED") {
    if (!admissionNo) {
      return NextResponse.json({ error: "An admission number is required to approve this application." }, { status: 400 });
    }
    const duplicate = await prisma.student.findUnique({ where: { schoolId_admissionNo: { schoolId, admissionNo } } });
    if (duplicate) {
      return NextResponse.json({ error: "This admission number is already in use." }, { status: 409 });
    }

    const student = await prisma.$transaction(async (tx) => {
      const created = await tx.student.create({
        data: {
          schoolId,
          admissionNo,
          firstName: application.applicantFirstName,
          lastName: application.applicantLastName,
          gender: application.gender,
          dateOfBirth: application.dateOfBirth,
          classId: classId ?? application.desiredClassId,
        },
      });
      await tx.admissionApplication.update({
        where: { id },
        data: { status: "APPROVED", notes, reviewedById: user.id, createdStudentId: created.id },
      });
      return created;
    });

    await recordAudit({ schoolId, userId: user.id, action: "RECORD_UPDATED", targetType: "AdmissionApplication", targetId: id, metadata: { status, studentId: student.id } });

    return NextResponse.json({ application: { ...application, status: "APPROVED" }, student });
  }

  const updated = await prisma.admissionApplication.update({
    where: { id },
    data: { status, notes, reviewedById: user.id },
  });

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_UPDATED", targetType: "AdmissionApplication", targetId: id, metadata: { status } });

  return NextResponse.json({ application: updated });
}
