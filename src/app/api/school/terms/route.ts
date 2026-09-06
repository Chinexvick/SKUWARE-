import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES, ADMIN_AND_STAFF_ROLES } from "@/lib/auth/api-guard";
import { termSchema } from "@/lib/validation";
import { recordAudit } from "@/lib/auth/audit";

export async function GET(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_AND_STAFF_ROLES);
  if (!user) return response!;

  const sessionId = req.nextUrl.searchParams.get("sessionId") ?? undefined;

  // Scope through the session's schoolId — Term has no schoolId column of its own.
  const terms = await prisma.term.findMany({
    where: { session: { schoolId: user.schoolId! }, ...(sessionId ? { sessionId } : {}) },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json({ terms });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = termSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { sessionId, name, startDate, endDate, isCurrent } = parsed.data;

  if (endDate <= startDate) {
    return NextResponse.json({ error: "End date must be after start date." }, { status: 400 });
  }

  const session = await prisma.academicSession.findFirst({ where: { id: sessionId, schoolId: user.schoolId! } });
  if (!session) {
    return NextResponse.json({ error: "Academic session not found." }, { status: 404 });
  }

  const term = await prisma.$transaction(async (tx) => {
    if (isCurrent) {
      await tx.term.updateMany({ where: { sessionId }, data: { isCurrent: false } });
    }
    return tx.term.create({ data: { sessionId, name, startDate, endDate, isCurrent: !!isCurrent } });
  });

  await recordAudit({
    schoolId: user.schoolId,
    userId: user.id,
    action: "RECORD_CREATED",
    targetType: "Term",
    targetId: term.id,
  });

  return NextResponse.json({ term }, { status: 201 });
}
