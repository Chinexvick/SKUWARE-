import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireApiUser } from "@/lib/auth/api-guard";

export async function GET(req: NextRequest) {
  const { user, response } = await requireApiUser(["SUPER_ADMIN", "CONTENT_MANAGER"]);
  if (!user) return response!;

  const status = req.nextUrl.searchParams.get("status") ?? undefined;
  const examName = req.nextUrl.searchParams.get("examName") ?? undefined;

  const questions = await prisma.question.findMany({
    where: { ...(status ? { reviewStatus: status as never } : {}), ...(examName ? { examName: examName as never } : {}) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ questions });
}
