import { z } from "zod";

export const signupSchema = z.object({
  schoolName: z.string().trim().min(2).max(150),
  ownerFirstName: z.string().trim().min(1).max(80),
  ownerLastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().min(7).max(20).optional(),
  password: z.string().min(10).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(190),
  password: z.string().min(1).max(128),
});

// --- School structure ---

export const sessionSchema = z.object({
  name: z.string().trim().min(2).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional().default(false),
});

export const termSchema = z.object({
  sessionId: z.string().min(1),
  name: z.string().trim().min(2).max(50),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isCurrent: z.boolean().optional().default(false),
});

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export const classSchema = z.object({
  name: z.string().trim().min(1).max(50),
});

export const armSchema = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1).max(20),
});

export const subjectSchema = z.object({
  name: z.string().trim().min(2).max(80),
  code: z.string().trim().max(20).optional(),
  departmentId: z.string().min(1).optional(),
});

// --- People ---

export const studentSchema = z.object({
  admissionNo: z.string().trim().min(1).max(30),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  dateOfBirth: z.coerce.date().optional(),
  classId: z.string().min(1).optional(),
  armId: z.string().min(1).optional(),
});

export const staffSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().min(7).max(20).optional(),
  role: z.enum(["PRINCIPAL", "VICE_PRINCIPAL", "BURSAR", "TEACHER", "STAFF", "GATE_STAFF"]),
  designation: z.string().trim().max(80).optional(),
  departmentId: z.string().min(1).optional(),
});

export const parentSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(190),
  phone: z.string().trim().min(7).max(20).optional(),
  studentAdmissionNos: z.array(z.string().trim().min(1)).optional().default([]),
});

// --- Academics ---

export const gradingComponentSchema = z.object({
  name: z.string().trim().min(1).max(50),
  maxScore: z.coerce.number().int().min(1).max(1000),
  order: z.coerce.number().int().min(0).max(100).optional().default(0),
});

export const assignmentSchema = z.object({
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  armId: z.string().min(1).optional(),
  termId: z.string().min(1),
});

export const scoreEntrySchema = z.object({
  studentId: z.string().min(1),
  componentId: z.string().min(1),
  score: z.coerce.number().min(0),
});

export const bulkScoreSchema = z.object({
  assignmentId: z.string().min(1),
  entries: z.array(scoreEntrySchema).min(1).max(500),
});

export const subjectCommentSchema = z.object({
  assignmentId: z.string().min(1),
  studentId: z.string().min(1),
  comment: z.string().trim().min(1).max(1000),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

export { slugify };
