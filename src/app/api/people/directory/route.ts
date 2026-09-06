import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * School-wide people search for starting a conversation — any authenticated
 * user at a school can find any other user there by name (parent, teacher,
 * staff, student, admin), rather than being limited to a single hardcoded
 * role list. Excludes the caller themself.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !user.schoolId) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const role = req.nextUrl.searchParams.get("role") ?? undefined;

  const results = await prisma.user.findMany({
    where: {
      schoolId: user.schoolId,
      id: { not: user.id },
      status: "ACTIVE",
      ...(role ? { role: role as never } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: { id: true, firstName: true, lastName: true, role: true, avatarUrl: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 30,
  });

  return NextResponse.json({ users: results });
}
