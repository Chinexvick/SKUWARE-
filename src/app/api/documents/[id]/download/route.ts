import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { readStoredFile } from "@/lib/storage";
import type { UserRole } from "@prisma/client";

const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "STAFF"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  const { id } = await params;

  const doc = await prisma.document.findFirst({ where: { id, schoolId: user.schoolId! } });
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (!STAFF_ROLES.includes(user.role)) {
    if (doc.ownerType === "student" && user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
      if (profile?.student?.id !== doc.ownerId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    } else {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const buffer = await readStoredFile(doc.storedPath).catch(() => null);
  if (!buffer) return NextResponse.json({ error: "File missing from storage." }, { status: 410 });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${doc.fileName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
