import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { recordAudit } from "@/lib/auth/audit";
import { notifySchool } from "@/lib/notifications";

const announcementSchema = z.object({
  title: z.string().trim().min(1).max(150),
  body: z.string().trim().min(1).max(2000),
  scope: z.enum(["school", "class", "individual"]).default("school"),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const announcements = await prisma.announcement.findMany({
    where: { schoolId: user.schoolId! },
    orderBy: { publishedAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ announcements });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser([...ADMIN_ROLES, "TEACHER"]);
  if (!user) return response!;

  const body = await req.json().catch(() => null);
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: { schoolId: user.schoolId!, ...parsed.data, createdBy: user.id },
  });

  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Announcement", targetId: announcement.id });

  // Scope-specific targeting (class/individual) isn't wired to actual
  // recipients yet — notify the whole school for every scope for now.
  await notifySchool(user.schoolId!, {
    title: `New announcement: ${announcement.title}`,
    body: announcement.body,
    link: "/dashboard",
  });

  return NextResponse.json({ announcement }, { status: 201 });
}
