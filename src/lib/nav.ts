import type { UserRole } from "@prisma/client";
import type { NavItem } from "@/components/layout/DashboardShell";

export const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  SUPER_ADMIN: [
    { label: "Overview", href: "/dashboard/super-admin" },
    { label: "Schools", href: "/dashboard/super-admin/schools" },
    { label: "Platform Users", href: "/dashboard/super-admin/users" },
    { label: "Billing", href: "/dashboard/super-admin/billing" },
    { label: "Audit Logs", href: "/dashboard/super-admin/audit" },
  ],
  CONTENT_MANAGER: [
    { label: "Overview", href: "/dashboard/content-manager" },
    { label: "Question Bank", href: "/dashboard/content-manager/questions" },
    { label: "University DB", href: "/dashboard/content-manager/universities" },
    { label: "Review Queue", href: "/dashboard/content-manager/review" },
  ],
  SCHOOL_OWNER: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Students", href: "/dashboard/admin/students" },
    { label: "Parents", href: "/dashboard/admin/parents" },
    { label: "Staff", href: "/dashboard/admin/staff" },
    { label: "Academics", href: "/dashboard/admin/academics" },
    { label: "Fees & Finance", href: "/dashboard/admin/finance" },
    { label: "Communication", href: "/dashboard/admin/communication" },
    { label: "Settings", href: "/dashboard/admin/settings" },
  ],
  PRINCIPAL: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Students", href: "/dashboard/admin/students" },
    { label: "Parents", href: "/dashboard/admin/parents" },
    { label: "Staff", href: "/dashboard/admin/staff" },
    { label: "Academics", href: "/dashboard/admin/academics" },
    { label: "Communication", href: "/dashboard/admin/communication" },
  ],
  VICE_PRINCIPAL: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Students", href: "/dashboard/admin/students" },
    { label: "Academics", href: "/dashboard/admin/academics" },
    { label: "Communication", href: "/dashboard/admin/communication" },
  ],
  STAFF: [
    { label: "Overview", href: "/dashboard/admin" },
    { label: "Students", href: "/dashboard/admin/students" },
  ],
  BURSAR: [
    { label: "Overview", href: "/dashboard/bursar" },
    { label: "Invoices", href: "/dashboard/bursar/invoices" },
    { label: "Payments", href: "/dashboard/bursar/payments" },
    { label: "Reports", href: "/dashboard/bursar/reports" },
  ],
  TEACHER: [
    { label: "Overview", href: "/dashboard/teacher" },
    { label: "My Classes", href: "/dashboard/teacher/classes" },
    { label: "Attendance", href: "/dashboard/teacher/attendance" },
    { label: "Grading", href: "/dashboard/teacher/grading" },
    { label: "Assignments", href: "/dashboard/teacher/assignments" },
    { label: "AI Assistant", href: "/dashboard/teacher/ai" },
  ],
  PARENT: [
    { label: "Overview", href: "/dashboard/parent" },
    { label: "Results", href: "/dashboard/parent/results" },
    { label: "Attendance", href: "/dashboard/parent/attendance" },
    { label: "Fees", href: "/dashboard/parent/fees" },
    { label: "Messages", href: "/dashboard/parent/messages" },
  ],
  STUDENT: [
    { label: "Overview", href: "/dashboard/student" },
    { label: "Timetable", href: "/dashboard/student/timetable" },
    { label: "Assignments", href: "/dashboard/student/assignments" },
    { label: "Results", href: "/dashboard/student/results" },
    { label: "AI Tutor", href: "/dashboard/student/ai-tutor" },
    { label: "Exam Prep", href: "/dashboard/student/exam-prep" },
  ],
  GATE_STAFF: [{ label: "Scan", href: "/dashboard/gate" }],
};

export const ROLE_LABEL: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  CONTENT_MANAGER: "Content Manager",
  SCHOOL_OWNER: "School Owner",
  PRINCIPAL: "Principal",
  VICE_PRINCIPAL: "Vice Principal",
  BURSAR: "Bursar / Accountant",
  TEACHER: "Teacher",
  STAFF: "Staff",
  PARENT: "Parent",
  STUDENT: "Student",
  GATE_STAFF: "Gate Staff",
};
