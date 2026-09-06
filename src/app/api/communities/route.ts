import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireApiUser, ADMIN_ROLES } from "@/lib/auth/api-guard";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recordAudit } from "@/lib/auth/audit";
import { notifyUsers } from "@/lib/notifications";
import type { UserRole } from "@prisma/client";

const CATEGORY_ROLES: Record<string, UserRole[]> = {
  ALL_TEACHERS: ["TEACHER"],
  ALL_PARENTS: ["PARENT"],
  ALL_STUDENTS: ["STUDENT"],
  ALL_STAFF: ["PRINCIPAL", "VICE_PRINCIPAL", "BURSAR", "TEACHER", "STAFF", "GATE_STAFF"],
};

const createSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  categories: z.array(z.enum(["ALL_TEACHERS", "ALL_PARENTS", "ALL_STUDENTS", "ALL_STAFF"])).default([]),
  studentClassId: z.string().min(1).optional(),
  memberUserIds: z.array(z.string().min(1)).default([]),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const communities = await prisma.community.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      _count: { select: { members: true } },
      members: { where: { userId: user.id }, select: { lastReadAt: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withUnread = communities.map(({ members, messages, ...rest }) => {
    const lastReadAt = members[0]?.lastReadAt ?? null;
    const lastMessageAt = messages[0]?.createdAt ?? null;
    const hasUnread = !!lastMessageAt && (!lastReadAt || lastMessageAt > lastReadAt);
    return { ...rest, hasUnread };
  });

  return NextResponse.json({ communities: withUnread });
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireApiUser(ADMIN_ROLES);
  if (!user) return response!;
  const schoolId = user.schoolId!;

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", details: parsed.error.flatten() }, { status: 400 });
  }
  const { name, description, categories, studentClassId, memberUserIds } = parsed.data;

  // Resolve categories to a snapshot of matching users at creation time —
  // membership doesn't silently grow/shrink as staff/students change later.
  const nonStudentRoles = Array.from(new Set(categories.filter((c) => c !== "ALL_STUDENTS").flatMap((c) => CATEGORY_ROLES[c])));
  const categoryUsers = nonStudentRoles.length > 0
    ? await prisma.user.findMany({ where: { schoolId, role: { in: nonStudentRoles }, status: "ACTIVE" }, select: { id: true } })
    : [];

  let studentCategoryUserIds: string[] = [];
  if (categories.includes("ALL_STUDENTS")) {
    // Students are matched through the Student record (not every student has
    // a login), optionally scoped to one class picked in the create form.
    const students = await prisma.student.findMany({
      where: { schoolId, userId: { not: null }, ...(studentClassId ? { classId: studentClassId } : {}) },
      select: { userId: true },
    });
    const profileIds = students.map((s) => s.userId).filter((v): v is string => !!v);
    if (profileIds.length > 0) {
      const profiles = await prisma.studentProfile.findMany({ where: { id: { in: profileIds } }, select: { userId: true } });
      studentCategoryUserIds = profiles.map((p) => p.userId);
    }
  }

  const explicitUsers = memberUserIds.length > 0
    ? await prisma.user.findMany({ where: { schoolId, id: { in: memberUserIds } }, select: { id: true } })
    : [];

  const memberIds = Array.from(
    new Set([user.id, ...categoryUsers.map((u) => u.id), ...studentCategoryUserIds, ...explicitUsers.map((u) => u.id)]),
  );

  const community = await prisma.community.create({
    data: {
      schoolId,
      name,
      description,
      createdById: user.id,
      members: { create: memberIds.map((userId) => ({ userId, isAdmin: userId === user.id })) },
    },
    include: { _count: { select: { members: true } } },
  });

  await recordAudit({ schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Community", targetId: community.id, metadata: { memberCount: memberIds.length } });

  await notifyUsers(
    memberIds.filter((id) => id !== user.id),
    { title: `Added to "${name}"`, body: description || "You've been added to a new community.", link: "/dashboard/messages" },
  );

  return NextResponse.json({ community }, { status: 201 });
}
