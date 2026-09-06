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
  email: z.string().trim().toLowerCase().email().max(190).optional(),
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

// --- Attendance ---

export const attendanceEntrySchema = z.object({
  studentId: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
});

export const markAttendanceSchema = z.object({
  classId: z.string().min(1),
  armId: z.string().min(1).optional(),
  date: z.coerce.date(),
  entries: z.array(attendanceEntrySchema).min(1).max(500),
});

// --- Fees & Payments ---

export const feeStructureSchema = z.object({
  name: z.string().trim().min(1).max(100),
  amount: z.coerce.number().positive(),
  termId: z.string().min(1),
  classId: z.string().min(1).optional(),
});

export const invoiceSchema = z.object({
  studentId: z.string().min(1),
  feeStructureId: z.string().min(1).optional(),
  description: z.string().trim().min(1).max(200),
  amountDue: z.coerce.number().positive(),
  dueDate: z.coerce.date().optional(),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(["CARD", "BANK_TRANSFER", "USSD", "CASH", "OTHER"]),
  reference: z.string().trim().max(100).optional(),
});

// --- Gate access ---

export const gateVerifySchema = z.object({
  code: z.string().trim().min(1).max(100),
});

// --- Admissions ---

export const admissionApplicationSchema = z.object({
  applicantFirstName: z.string().trim().min(1).max(80),
  applicantLastName: z.string().trim().min(1).max(80),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  guardianName: z.string().trim().min(1).max(150),
  guardianEmail: z.string().trim().toLowerCase().email(),
  guardianPhone: z.string().trim().max(20).optional(),
  desiredClassId: z.string().min(1).optional(),
});

export const admissionDecisionSchema = z.object({
  status: z.enum(["UNDER_REVIEW", "APPROVED", "REJECTED"]),
  notes: z.string().trim().max(500).optional(),
  classId: z.string().min(1).optional(),
  admissionNo: z.string().trim().min(1).max(30).optional(),
});

// --- Messages ---

export const messageSchema = z.object({
  recipientId: z.string().min(1),
  body: z.string().trim().min(1).max(2000),
});

// --- AI ---

export const aiChatSchema = z.object({
  conversationId: z.string().min(1).optional(),
  persona: z.enum(["STUDENT_TUTOR", "TEACHER_ASSISTANT", "PARENT_ASSISTANT"]),
  message: z.string().trim().min(1).max(4000),
});

export const questionGenerateSchema = z.object({
  examName: z.enum(["JAMB", "WAEC", "NECO", "POST_UTME"]),
  subject: z.string().trim().min(1).max(80),
  topic: z.string().trim().min(1).max(120).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.coerce.number().int().min(1).max(40).default(10),
});

// --- Homework assignments ---

export const homeworkSchema = z.object({
  title: z.string().trim().min(1).max(150),
  instructions: z.string().trim().min(1).max(4000),
  subjectId: z.string().min(1),
  classId: z.string().min(1),
  armId: z.string().min(1).optional(),
  termId: z.string().min(1),
  dueDate: z.coerce.date(),
});

export const submissionSchema = z.object({
  content: z.string().trim().min(1).max(10000),
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
