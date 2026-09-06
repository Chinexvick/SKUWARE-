import { NextRequest, NextResponse } from "next/server";
import { randomInt, randomBytes } from "crypto";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";

function generatePin(): string {
  return randomInt(100000, 999999).toString();
}

export async function GET() {
  const { user, response } = await requireApiUser([...ADMIN_ROLES, "GATE_STAFF"]);
  if (!user) return response!;

  const credentials = await prisma.gateCredential.findMany({
    where: { schoolId: user.schoolId! },
    include: { student: true },
    orderBy: { issuedAt: "desc" },
  });
  return NextResponse.json({ credentials });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const studentId = typeof body?.studentId === "string" ? body.studentId : null;
  if (!studentId) return NextResponse.json({ error: "studentId is required." }, { status: 400 });

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId: user.schoolId! } });
  if (!student) return NextResponse.json({ error: "Student not found." }, { status: 404 });

  const pin = generatePin();
  const qrToken = randomBytes(16).toString("hex");

  const credential = await prisma.gateCredential.upsert({
    where: { studentId },
    create: { schoolId: user.schoolId!, studentId, pin, qrToken, status: "ACTIVE" },
    update: { pin, qrToken, status: "ACTIVE" },
  });

  const qrDataUrl = await QRCode.toDataURL(qrToken, { margin: 1, width: 240 });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "GateCredential",
    targetId: credential.id,
  });

  return NextResponse.json({ credential, qrDataUrl }, { status: 201 });
}
