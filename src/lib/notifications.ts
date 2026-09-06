import { prisma } from "@/lib/db";

interface NotifyInput {
  title: string;
  body: string;
  link?: string;
}

/** Notify a specific set of users. */
export async function notifyUsers(userIds: string[], input: NotifyInput): Promise<void> {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, title: input.title, body: input.body, link: input.link })),
  });
}

/** Notify every active user belonging to a school. */
export async function notifySchool(schoolId: string, input: NotifyInput): Promise<void> {
  const users = await prisma.user.findMany({ where: { schoolId, status: "ACTIVE" }, select: { id: true } });
  await notifyUsers(users.map((u) => u.id), input);
}
