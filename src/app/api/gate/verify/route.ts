import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { gateVerifySchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser([...ADMIN_ROLES, "GATE_STAFF"]);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = gateVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }
  const { code } = parsed.data;
  const schoolId = user.schoolId!;

  const credential = await prisma.gateCredential.findFirst({
    where: { schoolId, OR: [{ pin: code }, { qrToken: code }] },
    include: { student: { include: { class: true, arm: true } } },
  });

  if (!credential) {
    return NextResponse.json({ result: "DENIED_UNKNOWN", message: "No student found for this code." }, { status: 200 });
  }

  const result = credential.status === "ACTIVE" ? "GRANTED" : "DENIED_STATUS";

  await prisma.gateLog.create({
    data: { schoolId, credentialId: credential.id, result, verifiedById: user.id },
  });

  return NextResponse.json({
    result,
    student: {
      firstName: credential.student.firstName,
      lastName: credential.student.lastName,
      admissionNo: credential.student.admissionNo,
      class: credential.student.class?.name ?? null,
      arm: credential.student.arm?.name ?? null,
    },
  });
}
