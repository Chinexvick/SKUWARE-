import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";
import { getCurrentUser } from "@/lib/auth/current-user";

const universitySchema = z.object({
  name: z.string().trim().min(2).max(150),
  state: z.string().trim().max(60).optional(),
  type: z.enum(["federal", "state", "private"]).optional(),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const universities = await prisma.university.findMany({ include: { courses: true }, orderBy: { name: "asc" } });
  return NextResponse.json({ universities });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = universitySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });

  const university = await prisma.university.create({ data: parsed.data });

  await recordAudit({ userId: user.id, action: "RECORD_CREATED", targetType: "University", targetId: university.id });

  return NextResponse.json({ university }, { status: 201 });
}
