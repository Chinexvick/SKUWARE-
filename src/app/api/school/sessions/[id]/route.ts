import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const { id } = await params;

  const session = await prisma.academicSession.findFirst({ where: { id, schoolId: user.schoolId! } });
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  await prisma.academicSession.delete({ where: { id } });
  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_DELETED",
    targetType: "AcademicSession",
    targetId: id,
  });

  return NextResponse.json({ message: "Session deleted." });
}
