import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { saveUploadedFile, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { recordAudit } from "@/lib/auth/audit";
import type { UserRole } from "@prisma/client";

const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "SCHOOL_OWNER", "PRINCIPAL", "VICE_PRINCIPAL", "STAFF"];

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const ownerType = req.nextUrl.searchParams.get("ownerType") ?? undefined;
  const ownerId = req.nextUrl.searchParams.get("ownerId") ?? undefined;

  if (!STAFF_ROLES.includes(user.role)) {
    // Non-staff can only see documents that are theirs.
    if (ownerType === "student" && user.role === "STUDENT") {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id }, include: { student: true } });
      if (profile?.student?.id !== ownerId) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    } else {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }
  }

  const documents = await prisma.document.findMany({
    where: { schoolId: user.schoolId!, ...(ownerType ? { ownerType } : {}), ...(ownerId ? { ownerId } : {}) },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  if (!STAFF_ROLES.includes(user.role)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data." }, { status: 400 });

  const file = form.get("file");
  const title = form.get("title")?.toString().trim();
  const category = form.get("category")?.toString();
  const ownerType = form.get("ownerType")?.toString() || "school";
  const ownerId = form.get("ownerId")?.toString() || null;

  if (!(file instanceof File)) return NextResponse.json({ error: "A file is required." }, { status: 400 });
  if (!title) return NextResponse.json({ error: "A title is required." }, { status: 400 });
  if (!category) return NextResponse.json({ error: "A category is required." }, { status: 400 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: "File is too large (max 10MB)." }, { status: 400 });
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type. Allowed: PDF, Word, PNG, JPEG." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedPath = await saveUploadedFile(user.schoolId!, file.name, buffer);

  const document = await prisma.document.create({
    data: {
      schoolId: user.schoolId!,
      ownerType,
      ownerId,
      category: category as never,
      title,
      fileName: file.name,
      storedPath,
      mimeType: file.type,
      size: file.size,
      uploadedById: user.id,
    },
  });

  await recordAudit({ schoolId: user.schoolId, userId: user.id, action: "RECORD_CREATED", targetType: "Document", targetId: document.id });

  return NextResponse.json({ document }, { status: 201 });
}
