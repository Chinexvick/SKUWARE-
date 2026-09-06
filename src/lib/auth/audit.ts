import { prisma } from "@/lib/db";
import { Prisma, type AuditAction } from "@prisma/client";

export async function recordAudit(params: {
  schoolId?: string | null;
  userId?: string | null;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        schoolId: params.schoolId ?? null,
        userId: params.userId ?? null,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        metadata: (params.metadata ?? {}) as Prisma.InputJsonValue,
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit logging must never break the primary request flow.
    console.error("[audit] failed to record audit log", err);
  }
}
