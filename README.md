# Skuware — School Operating System

Skuware is a multi-tenant school operating system for Nigerian schools. This
repository contains the full engine plus every core module from the product
blueprint (`docs/product-blueprint.md`), wired end-to-end with real data —
not just UI shells. The public marketing/landing page is deliberately not
built yet — it will be added and wired to this engine separately.

> Brand: primary yellow `#FAEE1E`, black `#000000`, white `#FFFFFF`, dark gray
> `#1E1E1E`, light gray `#F4F4F4`. Typeface: Montserrat. See `public/brand/`
> for logo assets.

## Modules

### Engine
Multi-tenant auth (JWT access token + rotating hashed refresh token), RBAC
across 11 roles, brute-force lockout, rate limiting, CSRF defense, security
headers, and tenant-scoped audit logging. See the "Security posture" section
below.

### School structure & people
Academic sessions/terms, classes/arms, departments, subjects — plus student,
staff, and parent records. Staff and parent creation provisions a real login
account (temporary password, since no email provider is wired up yet).

### Academics
Teacher-subject-class assignments, configurable grading components, score
entry (teacher-scoped to their own assignment), subject comments, and a
computed report card (never a stale snapshot) with the **Nigerian secondary
school grading scale**: A (70–100, Excellent), B (60–69, Very Good), C
(50–59, Good), D (45–49, Fair), E (40–44, Pass), F (0–39, Fail) — the scale
used on WAEC/NECO-style continuous-assessment report cards, not a generic
A–F curve.

### Attendance
Daily register (Present/Absent/Late/Excused) taken by class teachers,
attendance-rate history for parents/students, tenant- and role-scoped.

### Fees & Finance
Fee structures, invoices, and payment recording. **No payment gateway is
wired up** (no Paystack/Flutterwave keys configured) — payments are recorded
as reported through offline channels (bank transfer, cash, POS) so schools
can track collections today; a gateway integration later is a matter of
adding a webhook that calls the same recording logic.

### Gate Access
PIN + QR credential issuance per student, and a verification endpoint gate
staff use to check identity/status. No camera-based scanning UI yet — manual
code entry works today, including with keyboard-wedge barcode scanners.

### Documents
Secure file upload/download (PDF, Word, PNG, JPEG, 10MB cap) on local disk
storage, private (never under `/public`), access-checked per request. Swap
`src/lib/storage.ts` for an S3/R2 client before running multiple instances.

### Admissions
Application intake, review, and approval → automatically creates the
student record and admission number. Public online application intake is
deferred with the marketing site — admissions staff record applications
today (phone/email/walk-in), which still exercises the full pipeline.

### Communication
School-wide/class/individual announcements, and direct messaging between
parents and staff.

### Homework / Assignments
Teachers (scoped to their own class assignment) create homework; students
in that class see and submit it.

### AI layer
Three personas — Student AI Tutor, Teacher AI Assistant, Parent AI
Assistant — plus an AI exam-question generator for JAMB/WAEC/NECO/Post-UTME
practice tests with instant marking and explanations. All AI calls go
through `src/lib/ai/provider.ts`, a thin wrapper over the Anthropic Messages
API. **Set `ANTHROPIC_API_KEY`** (see `.env.example`) to activate it — until
then, every AI endpoint returns a clearly-labeled "not configured" message
instead of a fabricated response; the UI surfaces that state honestly.
AI-generated questions are tagged `AI_GENERATED` and start in `DRAFT`
review status, distinct from any future licensed past-question content.

### Content management (platform staff)
A review queue for AI-generated questions (approve/flag), and a minimal
university database (name/state/type) — the foundation for the Post-UTME
prep track described in the blueprint; course-level admission-requirement
management is the next layer to build here.

### Platform administration (Super Admin)
Read-only views over schools, users, and the audit log. Subscription
billing enforcement isn't built — schools currently sign up on a trial tier
with no billing gate.

## Security posture (cybersecurity is a stated priority)

- **Password storage:** bcrypt, cost factor 12, with a server-side strength
  check (10+ chars, upper/lower/digit, common-password rejection).
- **Sessions:** short-lived signed JWT access tokens (HS256) in an
  `httpOnly`, `SameSite=Lax` cookie; refresh tokens are opaque random values
  — only their SHA-256 hash is stored — rotated on every use, with reuse of
  an already-rotated token revoking the entire token family (theft
  detection).
- **Brute-force protection:** per-account lockout after 5 failed attempts
  (15-minute cooldown) plus IP- and account-scoped rate limiting on
  auth endpoints; AI endpoints are separately rate-limited per user since
  they're the platform's most cost-variable feature.
- **CSRF defense:** cookie-authenticated mutating requests are rejected if
  their `Origin` doesn't match the app's own origin.
- **Security headers:** CSP, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, HSTS, restrictive `Permissions-Policy`
  on every response.
- **Tenant isolation:** every tenant-scoped query filters by the
  authenticated session's `schoolId`, never a client-supplied value; RBAC is
  checked at the route level (`src/proxy.ts`) and again in every server
  component/API route (defense in depth).
- **No sensitive fields leak over the wire:** a `safeUserSelect` allowlist
  is applied everywhere a `User` is nested in an API response — this caught
  and fixed a real `passwordHash`-in-response bug during development
  (verified with an automated re-check across every affected endpoint).
- **File uploads:** MIME-type allowlist, 10MB cap, stored outside
  `/public`, access-checked per download request.
- **Audit trail:** auth and record-mutation events are logged with actor,
  tenant, IP, and user agent.

### Known gaps to close before production launch

- Rate limiting is in-memory (single instance only) — move to Redis once
  horizontally scaled.
- No transactional email provider — verification/invite links and
  temporary passwords are logged server-side (`console.info`) instead of
  emailed/SMS'd. Search `TODO(integration)`.
- No payment gateway (Paystack/Flutterwave) — fee collection is
  offline-recorded only.
- No MFA/TOTP flow yet (schema has the fields ready).
- No automated security test suite yet.
- Timetable (period-by-period scheduling) isn't built.
- NDPR (Nigeria Data Protection Regulation) compliance — retention policy,
  data subject access/deletion flow — is a legal/product workstream, not
  purely engineering.

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm (`corepack enable` if you don't have it)

### Setup

```bash
pnpm install
cp .env.example .env   # fill in DATABASE_URL, AUTH_JWT_SECRET, and (optionally) ANTHROPIC_API_KEY
pnpm db:migrate         # applies prisma/migrations and generates the client
pnpm dev
```

Visit `http://localhost:3000/signup` to register a school, then
`http://localhost:3000/login` to sign in as its owner.

### Project structure

```
prisma/schema.prisma          Full data model (tenancy, people, academics,
                               attendance, fees, gate access, documents,
                               admissions, communication, AI, exam prep)
src/lib/auth/                 Password hashing, JWT + refresh tokens, RBAC,
                               rate limiting, audit logging, server guards
src/lib/ai/                   AI provider abstraction + persona prompts
src/lib/academics/            Grading-scale logic (Nigerian A–F bands)
src/lib/storage.ts            Local-disk document storage
src/lib/db.ts                 Prisma client singleton
src/proxy.ts                  Route protection + security headers
src/app/api/*                 One route group per module (see above)
src/app/dashboard/*           One route tree per role
src/components/ui             Brand-styled Button, Input, Card
src/components/layout         DashboardShell (sidebar + topbar)
src/components/academics      Shared report-card / attendance-history views
src/components/ai             Shared AI chat panel
public/brand                  Logo assets extracted from the brand book
```

### Roles

`SUPER_ADMIN`, `CONTENT_MANAGER` (platform-level, no `schoolId`), and
per-tenant roles `SCHOOL_OWNER`, `PRINCIPAL`, `VICE_PRINCIPAL`, `BURSAR`,
`TEACHER`, `STAFF`, `PARENT`, `STUDENT`, `GATE_STAFF`. See
`src/lib/auth/rbac.ts` for the dashboard-access matrix and `src/lib/nav.ts`
for per-role navigation.

## What's next

The public marketing/landing site is intentionally deferred and will be
connected to this engine afterward. Beyond that, the next layers are:
course-level university admission requirements (Post-UTME prep), licensed
past-question import workflow, period-by-period timetabling, a payment
gateway integration, and a transactional email/SMS provider.
