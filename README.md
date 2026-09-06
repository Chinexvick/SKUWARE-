# Skuware — Core Engine

Skuware is a multi-tenant school operating system for Nigerian schools. This
repository currently contains the **engine**: multi-tenant authentication,
role-based access control, and dashboard shells for every stakeholder role.
The public landing page is deliberately not built yet — it will be added and
wired to this engine later.

> Brand: primary yellow `#FAEE1E`, black `#000000`, white `#FFFFFF`, dark gray
> `#1E1E1E`, light gray `#F4F4F4`. Typeface: Montserrat. See `public/brand/`
> for logo assets.

## What's built

- **Multi-tenant data model** (Prisma/PostgreSQL) — every school is a tenant
  (`School`), every operational record carries a `schoolId`.
- **Signup** — a school owner registers their school and gets an owner
  account (`POST /api/auth/signup`).
- **Login / logout / refresh** — JWT access tokens (15 min, httpOnly cookie)
  + rotating opaque refresh tokens (30 days, hashed at rest, family-revoked
  on reuse detection).
- **Role-based dashboards** for every party: Super Admin, Content Manager
  (platform staff), School Owner / Principal / Vice Principal / Staff
  (shared admin view), Bursar, Teacher, Parent, Student, Gate Staff.
- **Route protection** in `src/proxy.ts` (Next.js "proxy", formerly
  "middleware"): unauthenticated users are redirected to `/login`; a role
  visiting a dashboard it isn't permitted to see is redirected to its own.
- **Audit logging** on auth events (login success/failure, signup, logout)
  writes to `AuditLog`, scoped by tenant.

## Security posture (cybersecurity is a stated priority)

- **Password storage:** bcrypt, cost factor 12. Server-side strength check
  (10+ chars, upper/lower/digit, common-password rejection) — see
  `src/lib/auth/password.ts`.
- **Session design:** short-lived signed JWT access tokens (HS256, `jose`)
  in an `httpOnly`, `SameSite=Lax` cookie; refresh tokens are opaque random
  values, only their SHA-256 hash is stored, and each use rotates the token
  and revokes the old one. Reuse of an already-rotated refresh token
  revokes the entire token family for that user (theft-detection pattern).
- **Brute-force protection:** per-account lockout after 5 failed attempts
  (15-minute cooldown) plus IP- and account-scoped rate limiting on
  login/signup/refresh endpoints (`src/lib/auth/rateLimit.ts` — in-memory
  for the current single-instance setup; swap for Redis before running
  multiple instances behind a load balancer).
- **CSRF defense:** cookie-authenticated state-changing requests
  (`POST`/`PUT`/`PATCH`/`DELETE` under `/api/*`) are rejected if their
  `Origin` header doesn't match the app's own origin (`src/proxy.ts`).
- **Security headers:** CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Strict-Transport-Security`, restrictive `Permissions-Policy`, and
  `Referrer-Policy` are set on every response.
- **Tenant isolation:** every tenant-scoped Prisma query is expected to
  filter by `schoolId` derived from the authenticated session — never from
  a client-supplied value. RBAC checks happen both in `proxy.ts` (route
  level) and again in each server component via `requireUser()` (defense
  in depth — never trust the router alone).
- **No plaintext secrets in the repo:** `.env` is git-ignored; see
  `.env.example` for required variables. Generate `AUTH_JWT_SECRET` with
  `openssl rand -base64 48`.
- **Audit trail:** auth-sensitive actions are recorded with actor, tenant,
  IP, and user agent for later forensic review.

### Known gaps to close before production launch

These are explicitly deferred, not overlooked:

- Rate limiting is in-memory (single instance only) — move to Redis
  (e.g. Upstash) once horizontally scaled.
- No transactional email provider wired up yet — verification and
  password-reset links are currently logged to the server console
  (`console.info`) instead of emailed. Search `TODO(integration)`.
- No MFA/TOTP flow yet (schema has `mfaEnabled`/`mfaSecret` fields ready).
- No automated security test suite yet (isolation tests, auth abuse tests).
- NDPR (Nigeria Data Protection Regulation) compliance workstream —
  retention policy, data subject access/deletion flow — is a legal/product
  task, not just an engineering one.

## Getting started

### Prerequisites

- Node.js 20+
- PostgreSQL 14+
- pnpm (`corepack enable` if you don't have it)

### Setup

```bash
pnpm install
cp .env.example .env   # then fill in DATABASE_URL and AUTH_JWT_SECRET
pnpm db:migrate         # applies prisma/migrations and generates the client
pnpm dev
```

Visit `http://localhost:3000/signup` to register a school, then
`http://localhost:3000/login` to sign in as its owner.

### Project structure

```
prisma/schema.prisma        Core multi-tenant data model
src/lib/auth/                Password hashing, JWT + refresh tokens, RBAC,
                              rate limiting, audit logging, server guards
src/lib/db.ts                Prisma client singleton
src/proxy.ts                 Route protection + security headers (Next "proxy")
src/app/api/auth/*            Signup, login, logout, refresh, verify-email, me
src/app/login, src/app/signup Auth pages
src/app/dashboard/*           One route per role group (admin, bursar,
                              teacher, parent, student, gate, super-admin,
                              content-manager)
src/components/ui             Brand-styled Button, Input, Card
src/components/layout         DashboardShell (sidebar + topbar)
public/brand                  Logo assets extracted from the brand book
```

### Roles

`SUPER_ADMIN`, `CONTENT_MANAGER` (both platform-level, no `schoolId`), and
per-tenant roles `SCHOOL_OWNER`, `PRINCIPAL`, `VICE_PRINCIPAL`, `BURSAR`,
`TEACHER`, `STAFF`, `PARENT`, `STUDENT`, `GATE_STAFF`. See
`src/lib/auth/rbac.ts` for the dashboard-access matrix and
`src/lib/nav.ts` for per-role navigation.

## What's next

This is the engine + shells; the module build-out (academics, attendance,
fees/payments, admissions, communication, AI tutor/exam-prep, gate access,
question bank, university database) follows in phases per the product
blueprint. The public marketing/landing site is intentionally deferred and
will be connected to this engine afterward.
