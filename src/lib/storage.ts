import { mkdir, writeFile, readFile } from "fs/promises";
import { join } from "path";
import { randomBytes } from "crypto";

/**
 * Local-disk file storage, private (never under /public). Fine for a single
 * instance; before running multiple app instances or wanting geo-redundant
 * backups, swap this for an object store (S3/R2/Cloudinary) — callers only
 * depend on `storedPath` being an opaque string this module can resolve.
 */
const STORAGE_ROOT = join(process.cwd(), "storage", "uploads");

export async function saveUploadedFile(schoolId: string, fileName: string, buffer: Buffer): Promise<string> {
  const dir = join(STORAGE_ROOT, schoolId);
  await mkdir(dir, { recursive: true });
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomBytes(8).toString("hex")}-${safeName}`;
  await writeFile(join(dir, storedName), buffer);
  return join(schoolId, storedName);
}

export async function readStoredFile(storedPath: string): Promise<Buffer> {
  return readFile(join(STORAGE_ROOT, storedPath));
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB
