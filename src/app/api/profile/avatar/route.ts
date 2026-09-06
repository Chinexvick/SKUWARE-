import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { recordAudit } from "@/lib/auth/audit";

// Stored as a data: URI directly on the User row rather than on local disk —
// serverless functions here don't have persistent/shared disk storage, so an
// object-store integration would be needed for anything larger. Small
// profile photos are a reasonable fit for this, capped well under Postgres's
// per-value limits.
const MAX_DATA_URL_LENGTH = 700_000; // ~500KB of image data once base64-decoded

const bodySchema = z.object({
  dataUrl: z.string().min(1).max(MAX_DATA_URL_LENGTH).regex(/^data:image\/(png|jpeg|jpg|webp);base64,/),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please upload a PNG, JPEG, or WEBP image under 500KB." }, { status: 400 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: parsed.data.dataUrl } });
  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_UPDATED", targetType: "User", metadata: { field: "avatarUrl" } });

  return NextResponse.json({ avatarUrl: parsed.data.dataUrl });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await prisma.user.update({ where: { id: user.id }, data: { avatarUrl: null } });
  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_UPDATED", targetType: "User", metadata: { field: "avatarUrl", removed: true } });

  return NextResponse.json({ ok: true });
}
