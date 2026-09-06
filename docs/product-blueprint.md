# SKUWARE — Product Blueprint
### A Multi-Tenant Nigerian School Operating System with AI Academic Tutoring & Exam Preparation

**Status:** Product planning / pre-build
**Prepared as:** Foundation document for design, engineering, and AI teams

---

## Table of Contents

1. Product Overview & Vision
2. Target Users
3. Complete Feature Architecture
4. Module Breakdown
5. AI Architecture
6. Nigerian Exam Preparation Architecture
7. Question Bank Architecture
8. University Database Architecture
9. User Journeys
10. Dashboard Architecture
11. Database Architecture
12. API Architecture
13. Multi-Tenant Architecture
14. Security & Permissions
15. Notification Architecture
16. Payment Architecture
17. MVP Definition
18. Phase 2
19. Phase 3
20. Development Roadmap
21. Monetization
22. Scalability Strategy
23. Risks & Mitigations
24. Recommended Technology Stack
25. High-Level System Architecture
26. Recommended Folder/Project Structure
27. Suggested Database Schema
28. AI/RAG Architecture
29. Exam Engine Architecture
30. Content Management Architecture
31. University Information Architecture
32. Admin Workflows
33. Teacher Workflows
34. Parent Workflows
35. Student Workflows
36. Assumptions Log

---

## 1. Product Overview & Vision

Skuware is a multi-tenant SaaS platform that acts as the digital operating system for Nigerian primary and secondary schools, extended with a genuinely differentiated layer: an AI-powered academic tutor and Nigerian exam-preparation engine (JAMB/UTME, WAEC, NECO, Post-UTME) sitting inside the Student Portal.

Two things make Skuware more than "a school management dashboard":

- **Operational depth** — one platform running admissions, academics, attendance, fees, communication, documents, and gate access for a school, with role-based portals for every stakeholder.
- **AI-native learning layer** — a tutoring and exam-prep system that is valuable to the *student directly*, independent of whether their school is a Skuware customer. This is what creates a second revenue line (B2C-ish, sold through the B2B relationship) and a genuine moat, since incumbents in this space (SchoolGate-type products, various local school ERPs) are operationally focused only.

**Core product thesis:** Skuware sells operational software to schools (B2B SaaS) and layers a consumer-grade AI learning product on top of the student relationship the school gives it access to (B2B2C). The two halves reinforce each other — schools adopt for operations, retention is strengthened by parents/students valuing the AI tutor, and the AI tutor subscription becomes an upsell even to students whose schools haven't bought the core platform (a possible longer-term direct-to-student channel, see Phase 3).

---

## 2. Target Users

| Role | Primary needs |
|---|---|
| School Owner / Proprietor | Visibility into revenue, enrollment, staff, and school performance; low operational overhead |
| Principal / Vice Principal | Academic oversight, staff management, discipline, reporting |
| Bursar / Accountant | Fee collection, reconciliation, refunds, financial reporting |
| Teacher | Class management, attendance, grading, content creation, AI-assisted lesson prep |
| Student | Learning materials, assignments, results, and — centrally — AI tutoring and exam prep |
| Parent | Visibility into child's academics, attendance, fees; ability to pay and communicate with the school |
| Gate/Security Staff | Fast identity + access-status verification at entry points |
| Super Admin (Skuware staff) | Tenant provisioning, content moderation, platform health, billing operations |
| Content Manager (Skuware staff) | Curating/approving question banks, university data, licensed past questions |

---

## 3. Complete Feature Architecture

Feature tree, grouped by domain (used later to derive services and database entities):

- **Identity & Tenancy:** tenant (school) accounts, users, roles, permissions, sessions
- **School Management:** sessions, terms, classes, arms/sections, departments, subjects, calendar, announcements
- **People Management:** students, parents, teachers, staff, staff-student-class relationships
- **Academics:** subject-teacher assignment, grading systems, continuous assessment (CA), examinations, results, report cards, teacher comments
- **Attendance:** daily/period attendance, states (present/absent/late/excused), analytics, parent notifications
- **Fees & Payments:** fee structures, invoices, payments, receipts, outstanding balances, reminders, settlement
- **Finance Dashboard:** revenue, refunds, transaction trails, reconciliation, reports
- **Admissions:** applications, document upload, review pipeline, approval, class assignment, ID generation
- **Communication:** announcements (school/class/individual), fee reminders, emergency alerts, multi-channel delivery
- **Documents:** student/staff documents, certificates, policies, secure storage
- **Gate/Access Security:** PIN, QR, barcode issuance and verification
- **School Website:** per-school public site (info, admissions, gallery, portal login)
- **AI Layer:** teacher AI assistant, parent AI assistant, student AI tutor, question generation, study plans, performance analysis
- **Nigerian Exam Prep:** JAMB/UTME, WAEC, NECO, Post-UTME/university screening
- **Question Bank & CMS:** subjects/topics/questions/answers/explanations, licensing workflow, moderation
- **University Database:** universities, courses, requirements, screening info
- **Exam Engine:** CBT delivery, timers, randomization, marking, analytics
- **Analytics:** school-level, class-level, student-level, financial

---

## 4. Module Breakdown

### 4.1 School Management Portal (Admin)
Owns the configuration layer every other module depends on: academic sessions/terms, classes/arms/departments/subjects, staff and student records, calendar, announcements, and permission assignment. This is the first module a school touches during onboarding and therefore the one that most determines time-to-value.

### 4.2 Parent Portal
A read-heavy, trust-building surface: academic visibility (results, grades, attendance, comments, assignments, materials), calendar/announcements, and a finance surface (outstanding fees, invoices, history, online payment, receipts). Notifications tie it together. The AI assistant for parents (section 9 of the original spec) sits here as a natural-language layer over data the parent already has permission to see — it should **never** expose more than the underlying dashboard already permits.

### 4.3 Student Portal
Two halves: (a) the operational half — timetable, subjects, assignments, notes/materials, grades/results, attendance, announcements, submission — and (b) the AI Academic Tutor & Nigerian Exam Prep half, which is the flagship differentiator (see section 6).

### 4.4 Teacher Application
Class/roster management, attendance-taking, grading and CA/exam entry, comments, assignment/material creation, performance tracking, and parent communication where permitted. AI assists with lesson planning, quiz/assignment generation, revision questions, and performance analysis — but per an explicit product decision to carry over from the school's grading philosophy: **AI never assigns final grades**; teachers remain the source of truth for grading, and AI accelerates compilation (totals, averages, positions) rather than replacing teacher judgment. *(This mirrors a decision already made for the related School OS concept — worth confirming it should carry over identically to Skuware, since Skuware's spec is otherwise more AI-forward.)*

### 4.5 Fees & Finance
Fee structure definition per class/term, invoice generation, online payment collection, receipts, outstanding-balance tracking, reminders, and a finance dashboard for revenue/refunds/reconciliation/settlement, built on an auditable transaction trail.

### 4.6 School Gate / Access Security
Every student gets a unique PIN plus QR and barcode credentials. Gate staff scan/enter a credential and get a verification result: identity + configured access/payment status (e.g., "fees current" flags can gate certain access if a school opts into that policy — this should be **configurable per school**, not hard-coded, since fee-based access restriction is a sensitive policy decision many schools may not want).

### 4.7 Admissions
Public-facing application intake (often via the school website), document upload, staff review/approval workflow, class assignment, and automatic student account + ID generation on approval — the bridge from "prospective family" to "active student" in the system.

### 4.8 School Website
A generated public site per school (info, principal's message, programs, gallery, news, admissions entry point, portal login). **Flag:** the original spec asks for this to be systematized/possibly AI-assisted; a related concept for this same product family explicitly decided *against* AI website generation in favor of manually designed sites wired into the portal. Recommend resolving this explicitly before build — see Assumptions Log (36).

### 4.9 Documents
Secure, permissioned file storage for student documents, certificates, admission records, academic records, staff documents, and school policies, with access scoped by role and tenant.

### 4.10 Staff Management & Role-Based Access
Staff profiles, department/role/class/subject assignment, schedules, attendance, and a permission model driving what every role above can see and do (Super Admin, School Owner, Principal, VP, Bursar, Teacher, Staff, Parent, Student).

---

## 5. AI Architecture

Skuware's AI surface has four consumer-facing personas, all backed by shared infrastructure:

| Persona | Consumes | Key capabilities |
|---|---|---|
| Student AI Tutor | Question bank, RAG knowledge base, student performance history | Concept teaching, Q&A, question generation, adaptive re-testing, mastery tracking |
| Teacher AI Assistant | Class/subject curriculum, student performance data | Lesson plans, quizzes, assignments, revision sets, class-level weakness analysis |
| Parent AI Assistant | Child's academic/attendance data (permission-scoped) | Plain-language progress summaries, "what to focus on" guidance |
| Content/Admin AI | Licensed content, generation logs | Drafting new questions/explanations for human review, flag low-confidence content |

**Shared services (see section 28 for detail):**
- LLM orchestration layer (prompt templates, tool-calling, persona routing)
- RAG pipeline over a vetted knowledge base (curriculum documents, licensed past questions with rights confirmed, admin-authored explanations)
- Vector database for semantic retrieval
- Question-generation pipeline with a distinct "generated, unreviewed" → "reviewed" → "trusted bank" state machine
- Performance/analytics engine feeding both the tutor's adaptivity and the parent/teacher summaries
- Moderation and confidence-handling layer (section 13 of the original spec) — every AI-asserted fact that could be wrong (a WAEC syllabus detail, a university's cut-off mark) must be traceable to a source and versioned, not asserted from raw model knowledge.

**Design principle:** the AI layer should be built so *any* of the four personas can be disabled per-tenant (a school might buy the operational suite without AI, especially at lower tiers) without touching the operational data model — i.e., AI is an add-on service layer, not baked into core tables.

---

## 6. Nigerian Exam Preparation Architecture

This is the flagship differentiator and deserves its own subsystem, cleanly separated from routine school academics (a JAMB mock is not tied to a specific school's term/class).

**Supported exam tracks:** JAMB/UTME, WAEC, NECO, Post-UTME/university-specific screening.

**Selection flow (question generator):**
`Exam → Subject → Topic → Sub-topic → Difficulty → Question count → Question type → Time limit → Generated test`

For Post-UTME specifically: `University → Course/Programme → Exam/Screening → Subjects → Practice`, since screening formats vary by institution.

**Core loop for the AI personal tutor** (adaptive learning loop):
`Learn → Practice → Test → Analyze → Reteach → Practice → Master`

**Two distinct content classes, never conflated in the UI or data model:**
1. **Officially licensed past questions** — only usable where a proper licensing/import agreement exists with the rights holder (JAMB, WAEC, NECO, or their authorized distributors). Treat this as a legal/commercial workstream, not a scraping task.
2. **AI-generated exam-style questions** — clearly labeled as such to students, generated against the syllabus/topic taxonomy, and passed through the moderation pipeline (section 30) before being promoted into a "trusted" pool used for scored mocks.

**Personalized study plan inputs:** target exam, exam date, current performance, weak subjects/topics, available study time, desired score, historical results — recalculated continuously as new test results arrive.

**Performance analysis outputs:** trend statements ("Mathematics improved from 48% to 67% over two weeks"), topic-level weak-spot identification, difficulty-band accuracy breakdowns, and next-study recommendations — generated from structured performance data, with narrative text as a thin AI layer on top of real numbers (not the AI inventing the numbers).

**Compliance flag:** university admission requirements and official exam formats change over time and by institution. Do not hard-code these; route them through the University Database's verified/versioned data pipeline (sections 8 and 31), never through unverified AI generation.

---

## 7. Question Bank Architecture

**Entities:** Exam → Subject → Topic → Sub-topic → Question → Answer(s) → Explanation, with cross-cutting attributes: difficulty, question type (MCQ/theory), exam year (for licensed content), source (licensed vs AI-generated), review status, and content version.

**State machine per question:**
`Draft (AI-generated or admin-authored) → Under Review → Approved (trusted bank) → Published` with a parallel `Flagged/Reported` state reachable from Published if a student or teacher reports an error, routing back to an admin correction workflow.

**Licensing workflow (for official past questions):** a distinct ingestion pipeline (bulk import with source metadata, license reference, and usage-rights tagging) kept structurally separate from the AI-generation pipeline, so licensed content can be audited independently and pulled entirely if a licensing relationship ends.

**Question pools for exams:** exams draw from tagged pools filtered by exam/subject/topic/difficulty at generation time, with randomization and configurable duplication limits across a student's practice history.

---

## 8. University Database Architecture

**Entities:** University → Faculty → Department → Course/Programme, each course carrying: admission requirements, subject requirements, screening/exam pattern references, application windows, and a "last verified" timestamp + source reference.

**Update process (must be explicit, not assumed static):** a content-manager-owned verification cadence (e.g., before each admissions cycle) with a visible "last verified" date shown to students, and an admin correction workflow identical in shape to the question-correction workflow in section 7. Treat this as licensed/curated reference data, not something AI free-generates.

---

## 9. User Journeys

**School Owner:** Registration → school setup (sessions/terms/classes) → staff onboarding → student onboarding → fee structure setup → academics configuration → launch to parents/students.

**Administrator:** Dashboard → student management → fees → academics → communication → reports.

**Teacher:** Login → assigned classes → attendance → lesson delivery (with AI assist) → assignments → grading/results entry → AI performance insights.

**Parent:** Registration → child linking (verification against school records) → fees visibility → payment → results/attendance visibility → communication with school → AI progress assistant.

**Student:** Login → dashboard → classes/materials → AI tutor (general learning) → JAMB/WAEC/NECO/Post-UTME prep selection → practice/mock exams → performance review → updated study plan.

**Gate Staff:** Login → scan QR/barcode or enter PIN → identity + access-status result → admit/deny per school policy.

---

## 10. Dashboard Architecture

General pattern applied per role: **first view = the 3–5 things this role checks daily**, not a kitchen-sink of every module.

- **School Owner:** enrollment trend, revenue vs. expected fees, staff headcount, quick links to reports.
- **Principal/VP:** academic performance snapshot, attendance trend, disciplinary/communication queue.
- **Bursar:** collected vs. outstanding fees, today's transactions, reminders due.
- **Teacher:** today's classes, pending grading, assignments due, AI quick-actions (generate quiz, lesson plan).
- **Parent:** child selector (if multiple children), outstanding balance banner, recent results/attendance, latest announcements.
- **Student:** timetable for today, assignments due, AI tutor entry point, exam-prep progress (streak/mastery %).
- **Gate Staff:** single-purpose scan screen, no navigation clutter.

Each dashboard needs: search, relevant filters (term/class/subject/date range), a notifications bell, and drill-down from summary card to detail view.

---

## 11. Database Architecture

Organized by bounded context, all context tables carrying a `school_id` (tenant) foreign key except platform-level and shared reference tables (question bank, university DB), which instead carry visibility/licensing flags since they're shared across tenants.

**Core entities (selected, not exhaustive — full schema in section 27):**
`Tenant/School`, `User`, `Role`, `Permission`, `AcademicSession`, `Term`, `Class`, `Arm`, `Department`, `Subject`, `Student`, `Parent`, `StudentParentLink`, `Staff`, `TeacherSubjectAssignment`, `Attendance`, `CAResult`, `ExamResult`, `ReportCard`, `FeeStructure`, `Invoice`, `Payment`, `Receipt`, `Announcement`, `Message`, `Document`, `AdmissionApplication`, `GateCredential`, `GateLog`.

**Shared/platform entities:** `Exam` (JAMB/WAEC/NECO/PostUTME), `ExamSubject`, `Topic`, `SubTopic`, `Question`, `Answer`, `Explanation`, `QuestionSource` (licensed/AI), `QuestionReviewStatus`, `University`, `Faculty`, `Department(University)`, `Course`, `AdmissionRequirement`, `StudentTestAttempt`, `StudentAnswerLog`, `StudyPlan`, `PerformanceSnapshot`.

**AI/content operations entities:** `AIGenerationLog` (prompt, model, output, persona), `ContentReviewQueue`, `ContentReport` (student/teacher flags an error), `ContentVersion`.

---

## 12. API Architecture

RESTful (or GraphQL, see stack notes) API surface segmented by bounded context, all endpoints scoped by tenant via an auth-derived `school_id` claim:

- `/auth/*` — login, token refresh, role resolution
- `/school/*` — sessions, terms, classes, subjects, calendar, announcements
- `/people/*` — students, parents, staff, linking
- `/academics/*` — CA, exams, results, report cards
- `/attendance/*`
- `/fees/*` — invoices, payments, receipts, reminders
- `/finance/*` — reports, reconciliation (admin/bursar-scoped)
- `/admissions/*`
- `/documents/*`
- `/gate/*` — credential issuance, verification
- `/communication/*` — announcements, messages, notification dispatch
- `/ai/tutor/*`, `/ai/teacher/*`, `/ai/parent/*` — persona-scoped AI endpoints
- `/exam-prep/*` — exam/subject/topic selection, test generation, submission, results
- `/question-bank/*` (admin/content-manager only) — CRUD + review workflow
- `/universities/*` — read-mostly, admin-managed writes
- `/analytics/*`

Webhooks needed for: payment provider callbacks, SMS/WhatsApp delivery status.

---

## 13. Multi-Tenant Architecture

**Model:** shared infrastructure, isolated data — every tenant-scoped table carries `school_id`; row-level security (or equivalent query-scoping middleware) enforces isolation at the database layer, not just the application layer, so a bug in one endpoint can't leak cross-tenant data.

**Shared vs. tenant-scoped data:** question bank, university database, and AI content pipelines are intentionally *shared* platform resources (this is where the exam-prep economics work — one question bank serves every school), while all operational school data is tenant-isolated.

**Scalability levers:** connection pooling per region, read replicas for analytics-heavy queries, background job queues for report generation/notifications, and a caching layer (e.g., Redis) for frequently-read shared reference data (question bank, university info) since it changes far less often than operational data.

**Operational necessities:** automated backups per tenant-aware schedule, point-in-time recovery, audit logs on all writes to financial and academic-record tables, and a tenant-level feature-flag system (so AI, exam-prep, or website modules can be toggled per school's plan tier).

---

## 14. Security & Permissions

- Role-based access control (RBAC) as the baseline, with the roles listed in section 2; consider attribute-based rules for edge cases (e.g., a teacher can only grade their assigned subjects/classes).
- Field-level restrictions where needed (e.g., a parent portal call must never be able to fetch another parent's child, even by ID manipulation — validate ownership server-side on every request, not just via UI hiding).
- Data protection: Nigeria's NDPR (Nigeria Data Protection Regulation) applies to student/parent PII — need a documented lawful basis for processing, data retention policy, and a data subject access/deletion process. **Flag as a compliance workstream**, not something to bolt on later.
- Payment data: never store raw card details — use tokenization via the payment processor (see section 16).
- Audit logging on financial transactions, grade changes, and admin permission changes at minimum.
- Gate/access credentials (PIN/QR/barcode) should be revocable and rotatable per student without needing a full account reset.

---

## 15. Notification Architecture

Multi-channel dispatch (push, SMS, email, WhatsApp-where-supported) behind a single notification service so business logic doesn't care which channel is used — channel selection driven by: message urgency (emergency alerts → push + SMS simultaneously), school configuration (some schools may not want WhatsApp costs), and user preference where offered.

**Trigger categories:** academic (new result, assignment due), attendance (absence alert to parent), financial (invoice issued, payment received, reminder), administrative (announcement, emergency alert), and exam-prep (mock exam completed, study-plan update).

Needs a delivery-status pipeline (sent/delivered/failed) especially for SMS/WhatsApp, since these often go through third-party aggregators with variable reliability — this matters a lot for fee reminders, where deliverability is core to a school's willingness to pay.

---

## 16. Payment Architecture

**Two distinct payment flows:**
1. **School fee collection** (parent → school, platform facilitates) — needs a Nigerian payment gateway (e.g., Paystack or Flutterwave — final choice is a commercial decision, both support Nigerian cards/bank transfer/USSD), invoice-to-payment reconciliation, receipt generation, and a settlement ledger per school.
2. **Platform subscription billing** (school → Skuware, and potentially student → Skuware for AI/exam-prep add-ons) — recurring billing, plan tiers, upgrade/downgrade proration, dunning for failed payments.

**Where transaction-fee revenue is legally/commercially appropriate:** a small platform fee on fee-collection transactions is a common SaaS-for-payments model in this space, but must be disclosed transparently to schools (this is a monetization lever, covered in section 21, not a hidden charge).

**Reconciliation:** every payment needs a transaction trail (gateway reference, invoice reference, settlement status) visible in the finance dashboard, with refund handling as a first-class flow, not an afterthought.

---

## 17. MVP Definition (Phase 1)

The MVP should prove the core B2B loop (a school can actually run) plus a *thin, working* slice of the AI differentiator — not the full exam-prep suite.

**Include:**
- Multi-tenant auth + RBAC (Super Admin, School Owner/Admin, Teacher, Parent, Student)
- School Management: sessions/terms/classes/arms/subjects, staff/student records
- Attendance (present/absent/late/excused)
- Academics: CA + exam entry, basic report card generation
- Fees: invoice generation, online payment, receipts, outstanding-balance view
- Parent Portal: results, attendance, fees, announcements
- Student Portal: timetable, assignments, materials, results
- Teacher App: class roster, attendance-taking, grading, assignment/material upload
- Basic communication: school/class announcements, push + SMS
- **One working AI slice:** the student AI tutor Q&A + AI question generator for *one* exam track (JAMB is the highest-value starting point given its universal relevance), *without* the full university-screening layer yet
- Documents (basic secure storage)

**Explicitly exclude from MVP:** gate/access (QR/PIN/barcode), school website generation, WAEC/NECO/Post-UTME tracks, teacher/parent AI assistants, university database, advanced analytics, admissions online-application pipeline (manual admission entry is fine at MVP).

**Why this scope:** it lets Skuware onboard real pilot schools and validate willingness-to-pay for the operational core, while shipping *one real, demonstrable* AI feature so the differentiator claim isn't vaporware — without the cost of building four exam tracks and a licensing pipeline before knowing if schools will pay at all.

---

## 18. Phase 2

Add once MVP is validated with pilot schools:
- WAEC and NECO exam tracks (full parity with JAMB track)
- Full question bank CMS with review/moderation workflow and licensing-import pipeline
- Gate/Access security (PIN/QR/barcode + gate-staff app)
- Admissions online-application pipeline
- Teacher AI assistant (lesson plans, quizzes, class performance analysis)
- Parent AI assistant (natural-language progress queries)
- Personalized study plans (continuously updated)
- Multi-channel notification expansion (WhatsApp)
- Finance dashboard expansion (reconciliation, refunds, settlement reporting)

---

## 19. Phase 3

Advanced/ecosystem features once the platform has scale:
- Post-UTME/university-specific screening prep + University Database
- AI performance analytics with trend narratives across the whole student base
- School website module (resolve manual-vs-AI-generated question first — section 4.8)
- Direct-to-student AI exam-prep subscription channel, independent of school adoption (B2C expansion)
- Advanced RAG-backed content verification and confidence handling at scale
- Cross-school (anonymized/aggregated) benchmarking analytics as a premium insight product

---

## 20. Development Roadmap

| Stage | Focus | Notes |
|---|---|---|
| 1. Discovery | Finalize MVP scope, resolve open assumptions (section 36), pilot-school commitments | 2–4 weeks |
| 2. UX/UI | Core portals wireframes → high-fidelity design, design system | 4–6 weeks, can overlap with backend architecture |
| 3. Architecture | Multi-tenant data model, auth, API contracts | 2–3 weeks |
| 4. Backend build | Core modules (school mgmt, people, academics, attendance, fees) | Highest complexity: fees/payments (external integration), academics (grading logic) |
| 5. Frontend/Mobile build | Admin web, teacher app, parent/student apps (consider PWA or React Native for parent/student to hit iOS+Android+web from one codebase) | Parallel to backend once API contracts are frozen |
| 6. AI build | Question generator + student tutor for one exam track | Highest complexity: RAG pipeline, moderation workflow, prompt reliability |
| 7. Payment integration | Gateway integration, reconciliation, settlement | Medium complexity, high care needed (money-handling code) |
| 8. Testing | Multi-tenant isolation testing, load testing, AI output review | Security/isolation testing is non-negotiable given school PII |
| 9. Security & compliance | NDPR review, penetration test | Before any pilot with live student data |
| 10. Pilot | 2–5 pilot schools, real usage over a term | Gather real willingness-to-pay + AI usage data |
| 11. Launch | Iterate from pilot feedback, broaden onboarding | |

**Relative complexity ranking (high → low):** AI/RAG + exam engine > Fees/payments integration > Multi-tenant academics engine > Communication/notifications > core school management CRUD.

---

## 21. Monetization

**Recommended model: tiered per-school SaaS subscription + optional AI/exam-prep add-on + modest payment-processing fee.**

| Tier | Target | Indicative inclusions |
|---|---|---|
| Free/Trial | New schools evaluating | Core school management, limited student count, no AI |
| Small School | <300 students | Core modules + fees, no/limited AI |
| Medium School | 300–1000 students | Core + AI teacher assistant + one exam track |
| Large School | 1000+ students | Full suite, all exam tracks, priority support |
| Premium AI Add-on | Any tier | Full AI tutor + all exam tracks + parent AI assistant |
| Student Exam-Prep Subscription | Individual students (B2C, Phase 3) | JAMB/WAEC/NECO/Post-UTME prep, independent of school tier |

**Payment transaction revenue:** a small percentage fee on fee-collection transactions, disclosed transparently — common in Nigerian edtech/fintech-adjacent SaaS and often more palatable to schools than a high flat subscription, since it scales with the school's own revenue.

**Most sustainable path (assumption, flagged):** subscription-plus-transaction-fee is likely more sustainable than subscription-only, because it aligns Skuware's revenue with school size/activity rather than a flat fee that's either too cheap for large schools or too expensive for small ones — but this needs validation against actual Nigerian school payment volumes during pilots.

---

## 22. Scalability Strategy

- Horizontal scaling of stateless API services behind a load balancer.
- Database: start with a single well-indexed multi-tenant Postgres instance; plan a path to read replicas (analytics/reporting queries) and, if a small number of very large tenants emerge, consider tenant-level sharding later rather than at launch (premature sharding adds complexity MVP doesn't need).
- Background job queue (e.g., for report generation, notification dispatch, AI question generation) so these never block request/response cycles.
- CDN for static assets and school website content.
- Vector DB and LLM calls isolated behind an AI service layer so scaling/caching AI traffic doesn't couple to core CRUD scaling.
- Rate-limiting on AI endpoints per tenant/user to control cost exposure (LLM calls are the platform's most variable cost).

---

## 23. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Reproducing copyrighted JAMB/WAEC/NECO past questions without a license | Strict separation of licensed vs. AI-generated content; a legal/licensing workstream before any "official past questions" claim is made in marketing |
| AI giving confidently wrong academic answers | RAG grounding, human review queue, confidence/versioning, visible "AI-generated" labeling, student/teacher error-reporting loop |
| University admission requirements going stale | Verified/versioned university DB with visible "last verified" date and a review cadence, not static hard-coded data |
| Cross-tenant data leakage | Row-level isolation enforced at the DB layer, not just app logic; isolation-focused test suite |
| Payment reconciliation errors | Transaction-trail-first design, dedicated reconciliation reports, refunds as first-class flow |
| Low school willingness-to-pay for AI add-on | Ship the MVP AI slice cheaply enough to validate demand before building all four exam tracks |
| NDPR non-compliance (student PII) | Documented lawful basis, retention policy, data subject access/deletion workflow before handling real student data at scale |
| SMS/WhatsApp deliverability issues undermining fee-reminder trust | Delivery-status tracking, fallback channels, aggregator SLAs |
| Feature scope creep delaying launch (this spec is very large) | Hold the line on the MVP definition in section 17; treat sections 18–19 as explicitly deferred |

---

## 24. Recommended Technology Stack

*(Reasonable defaults — final choice is a team/commercial decision; flagged as recommendations, not requirements.)*

- **Backend:** Node.js (NestJS) or a similar typed framework — good fit for a modular, multi-tenant service architecture; Python (FastAPI) if the team wants tighter integration with the AI/RAG pipeline in the same language as ML tooling.
- **Database:** PostgreSQL (row-level security support, strong relational fit for the academic/financial data model) + Redis for caching/queues.
- **Vector DB:** pgvector (if minimizing infra surface matters early) or a dedicated vector DB (e.g., Pinecone/Weaviate) if RAG scale demands it later.
- **Frontend (Admin/Teacher web):** React + TypeScript.
- **Mobile/Parent/Student:** React Native or Flutter for a single codebase across iOS/Android, or a PWA if budget favors web-first.
- **AI layer:** LLM API (Claude or similar) behind an orchestration service; RAG pipeline with embeddings + vector search; a moderation/review queue as its own service.
- **Payments:** Paystack or Flutterwave (Nigerian gateway coverage, card/bank transfer/USSD support).
- **Notifications:** dedicated transactional email provider + SMS/WhatsApp aggregator (e.g., Termii or similar Nigeria-focused providers) behind an internal notification-abstraction service.
- **Infra:** containerized services (Docker) on a cloud provider with a Nigeria-adjacent or Africa-serving region for latency; CI/CD pipeline; infrastructure-as-code from day one given the multi-tenant scaling path.

---

## 25. High-Level System Architecture

```
                    ┌─────────────────────────────────────────┐
                    │              Client Apps                 │
                    │  Admin Web | Teacher App | Parent App |   │
                    │  Student App | Gate App | School Website  │
                    └───────────────────┬───────────────────────┘
                                        │ HTTPS/REST(GraphQL)
                    ┌───────────────────▼───────────────────────┐
                    │            API Gateway / Auth Layer         │
                    │   (tenant resolution, RBAC, rate limiting)  │
                    └───────────────────┬───────────────────────┘
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼               ▼
  ┌───────────┐  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
  │ School Mgmt│  │  Academics  │ │ Fees/Payments│ │Communication│ │  Documents  │
  │ & People    │  │ & Attendance│ │ & Finance    │ │& Notifications│ │ & Admissions│
  └───────────┘  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
        │               │               │               │               │
        └───────────────┴───────┬───────┴───────────────┴───────────────┘
                                 ▼
                    ┌─────────────────────────┐
                    │   Multi-Tenant Postgres   │  (row-level isolation)
                    └─────────────────────────┘

                    ┌─────────────────────────────────────────┐
                    │              AI Service Layer              │
                    │  Orchestration | RAG | Vector DB |         │
                    │  Question Generator | Moderation Queue     │
                    └───────────────────┬───────────────────────┘
                                        │
                    ┌───────────────────▼───────────────────────┐
                    │   Shared Platform Data (cross-tenant)       │
                    │   Question Bank | University DB | Content   │
                    └─────────────────────────────────────────┘
```

---

## 26. Recommended Folder/Project Structure

```
skuware/
├── apps/
│   ├── admin-web/            # School Owner/Admin/Bursar/Principal web app
│   ├── teacher-app/
│   ├── parent-app/
│   ├── student-app/
│   ├── gate-app/              # lightweight scan-only app
│   └── school-site-template/  # per-tenant public website template
├── services/
│   ├── auth-tenancy/
│   ├── school-management/
│   ├── people/
│   ├── academics/
│   ├── attendance/
│   ├── fees-payments/
│   ├── finance/
│   ├── admissions/
│   ├── communication-notifications/
│   ├── documents/
│   ├── gate-access/
│   ├── analytics/
│   └── ai/
│       ├── orchestration/
│       ├── rag-pipeline/
│       ├── question-generator/
│       ├── tutor-persona/
│       ├── teacher-persona/
│       ├── parent-persona/
│       └── moderation/
├── platform-data/
│   ├── question-bank/
│   └── university-db/
├── packages/                  # shared types, UI components, API clients
├── infra/                     # IaC, CI/CD, deployment configs
└── docs/                      # this blueprint, ADRs, API specs
```

---

## 27. Suggested Database Schema (Key Tables)

*(Simplified — indicative columns only, not a full DDL.)*

**Tenancy & Identity**
- `schools(id, name, subdomain, plan_tier, settings_json, created_at)`
- `users(id, school_id NULL-for-platform-staff, email, phone, password_hash, role_id, status)`
- `roles(id, name)`; `permissions(id, name)`; `role_permissions(role_id, permission_id)`

**School Structure**
- `academic_sessions(id, school_id, name, start_date, end_date)`
- `terms(id, session_id, name, start_date, end_date)`
- `classes(id, school_id, name)`; `arms(id, class_id, name)`
- `departments(id, school_id, name)`; `subjects(id, school_id, name, department_id)`

**People**
- `students(id, school_id, class_id, arm_id, admission_no, name, dob, status)`
- `parents(id, school_id, name, phone, email)`
- `student_parent_links(student_id, parent_id, relationship)`
- `staff(id, school_id, name, role_id, department_id)`
- `teacher_subject_assignments(teacher_id, subject_id, class_id, term_id)`

**Academics & Attendance**
- `ca_results(id, student_id, subject_id, term_id, score, type)`
- `exam_results(id, student_id, subject_id, term_id, score)`
- `report_cards(id, student_id, term_id, summary_json, comments)`
- `attendance(id, student_id, date, status, recorded_by)`

**Fees & Finance**
- `fee_structures(id, school_id, class_id, term_id, amount, category)`
- `invoices(id, student_id, fee_structure_id, amount_due, status)`
- `payments(id, invoice_id, amount, gateway_ref, status, paid_at)`
- `receipts(id, payment_id, receipt_no, issued_at)`

**Admissions / Documents / Gate**
- `admission_applications(id, school_id, applicant_name, status, submitted_at)`
- `documents(id, school_id, owner_type, owner_id, file_ref, category)`
- `gate_credentials(id, student_id, pin, qr_code, barcode, status)`
- `gate_logs(id, credential_id, scanned_at, result, staff_id)`

**Communication**
- `announcements(id, school_id, scope, title, body, published_at)`
- `messages(id, sender_id, recipient_id, body, sent_at)`
- `notifications(id, user_id, channel, payload, status, sent_at)`

**Shared Platform (cross-tenant)**
- `exams(id, name)` — JAMB/WAEC/NECO/PostUTME
- `exam_subjects(exam_id, subject_id)`; `topics(id, subject_id, name)`; `sub_topics(id, topic_id, name)`
- `questions(id, topic_id, difficulty, type, source, review_status, content_version)`
- `answers(id, question_id, text, is_correct)`; `explanations(id, question_id, text)`
- `universities(id, name, type)`; `faculties(id, university_id, name)`; `university_departments(id, faculty_id, name)`
- `courses(id, department_id, name, admission_requirements_json, last_verified_at)`

**AI/Testing**
- `student_test_attempts(id, student_id, exam_id, config_json, score, started_at, completed_at)`
- `student_answer_logs(id, attempt_id, question_id, chosen_answer, correct, time_spent)`
- `study_plans(id, student_id, exam_id, plan_json, updated_at)`
- `performance_snapshots(id, student_id, subject_id, topic_id, accuracy, computed_at)`
- `ai_generation_logs(id, persona, prompt, output, model, created_at)`
- `content_review_queue(id, content_type, content_id, status, reviewer_id)`
- `content_reports(id, content_type, content_id, reported_by, reason, status)`

---

## 28. AI/RAG Architecture

**Pipeline:**
1. **Knowledge ingestion:** curriculum documents, licensed past questions (with rights metadata), admin-authored explanations, verified university data → chunked, embedded, stored in the vector DB with source + version metadata.
2. **Retrieval:** on a tutor query or question-generation request, retrieve top-k relevant chunks scoped to the requested exam/subject/topic.
3. **Generation:** LLM call with retrieved context + persona-specific system prompt (tutor vs. teacher-assistant vs. parent-assistant) + tool-calling access to structured student performance data where relevant.
4. **Grounding & confidence handling:** responses touching factual/changing information (syllabus details, university requirements) are required to cite retrieved source chunks; low-retrieval-confidence responses are flagged for human review rather than shown as authoritative.
5. **Moderation:** AI-generated questions/explanations land in `content_review_queue` before promotion to the trusted bank; a sampling-based human QA process even after promotion, since 100% manual review won't scale.
6. **Feedback loop:** `content_reports` from students/teachers routes back to content managers; corrections create a new `content_version` rather than silently overwriting (preserves audit trail).

**Student personalization:** performance data (`student_answer_logs`, `performance_snapshots`) feeds both the adaptive re-testing loop and the study-plan generator — the AI narrates from structured numbers rather than "remembering" a student's history unstructured, which keeps performance claims auditable.

---

## 29. Exam Engine Architecture

**Modes:** Practice (untimed, immediate feedback, explanations shown) vs. Examination/Mock (timed, no feedback until submission, mirrors real exam pacing).

**Delivery:** question pool assembled per the generator config (section 6), randomized per attempt within configured constraints (e.g., no more than N repeats of the same question across a student's last M attempts), timer enforced client- and server-side (server-side authoritative to prevent client tampering).

**Marking:** MCQ auto-marked instantly; theory/structured questions either AI-assisted marking with a confidence flag routed to teacher review, or manual-only marking, depending on tier/configuration — do not fully automate theory-question marking without a human-in-the-loop path given accuracy risk.

**Post-exam:** score breakdown by subject/topic/difficulty, review-incorrect-answers flow with explanations, and automatic feed into `performance_snapshots` and the study plan.

**Branding note:** design all CBT UX (timer style, navigation, flagging questions for review) to feel authentically exam-like without claiming to be an official JAMB/WAEC/NECO platform or reusing their branding/trademarks.

---

## 30. Content Management Architecture

A back-office CMS (admin/content-manager only) managing: subjects, topics, questions/answers/explanations, exam categories/years, difficulty levels, universities/courses/screening info, study materials/videos, and both AI-generated and licensed content — all behind the review/approval state machine described in section 7.

**Roles within the CMS:** Content Manager (create/edit), Reviewer (approve/reject), Super Admin (publish/rollback). Separate permissions from the school-facing RBAC entirely, since this is platform-level, not tenant-level.

---

## 31. University Information Architecture

Covered structurally in section 8; operationally, this is a **curated reference dataset** requiring an ongoing verification workflow (not a one-time import) — recommend a dedicated content-manager role responsible for a review cadence tied to Nigerian university admissions cycles (e.g., pre-JAMB registration period, post-JAMB cut-off announcements), with every course record showing a visible "last verified" date to set correct user expectations.

---

## 32. Admin Workflows

- **Onboarding a school:** create tenant → configure sessions/terms/classes/subjects → bulk-import or manually add staff/students → configure fee structure → invite parents.
- **Term rollover:** close current term → generate report cards → open new term → carry forward class/arm assignments (with promotion logic for year-end rollover).
- **Fee reminder cycle:** review outstanding invoices → trigger reminder batch → monitor payment inflow → reconcile.
- **Admission review:** review applications → request missing documents → approve/reject → assign class → trigger student account + ID/gate-credential generation.

---

## 33. Teacher Workflows

- **Daily:** take attendance → deliver lesson (optionally AI-assisted lesson plan) → review/grade submitted assignments.
- **Assessment cycle:** enter CA scores → enter exam scores → add comments → system compiles totals/averages/positions (AI-assisted compilation, teacher-owned grading).
- **AI-assisted prep:** request a lesson plan/quiz/revision set for a topic → review/edit AI output → publish to class.
- **Performance monitoring:** view class/subject performance breakdown → identify struggling students → optionally message parents.

---

## 34. Parent Workflows

- **Onboarding:** register → link to child (verified against school records, e.g., admission number + a school-provided code) → view dashboard.
- **Ongoing:** check results/attendance → receive announcements/alerts → pay outstanding fees → download receipts.
- **AI-assisted:** ask the parent AI assistant plain-language questions about the child's progress, scoped strictly to that parent's linked children's data.

---

## 35. Student Workflows

- **Daily academic:** check timetable → access materials/assignments → submit work.
- **AI tutor:** ask a concept question → receive explanation + examples → attempt practice questions → get evaluated → receive targeted re-teaching → re-test.
- **Exam prep:** select exam/subject/topic/difficulty → take practice or mock test → review results and explanations → receive/update personalized study plan → repeat for weak topics.

---

## 36. Assumptions Log

Explicitly flagged assumptions/decisions that should be confirmed before or during build:

1. **School website generation method** — this spec implies a systematized (possibly AI-assisted) per-school website, while a closely related concept in this product family explicitly chose manually designed sites wired into the portal instead. **Needs an explicit decision** since it changes both scope and the Phase placement of this feature.
2. **AI's role in grading** — assumed here (consistent with the related concept) that AI compiles/accelerates but teachers remain the grading authority; the current spec's language ("marking assistance where appropriate") is slightly more permissive and should be pinned down.
3. **Gate-access-to-fee-status linkage** — assumed configurable per school (some schools may not want to gate physical access on payment status); recommend never hard-coding this as mandatory.
4. **Licensed past-question access** — assumed no licensing agreements exist yet with JAMB/WAEC/NECO; the MVP and Phase 2 plans above intentionally lean on AI-generated (clearly labeled) content until/unless a licensing relationship is secured. This is a legal/commercial workstream outside engineering's control.
5. **Post-UTME scope** — assumed Phase 3 (not MVP) given the added complexity of per-university screening formats and the need for a verified, continuously updated university database.
6. **Payment gateway choice** — Paystack vs. Flutterwave left as a commercial decision; both are viable for the Nigerian market.
7. **Direct-to-student subscription channel** (student pays for exam-prep independent of school) — flagged as a Phase 3 exploration, not a committed roadmap item, since it changes the business model from purely B2B to B2B2C+B2C and has its own go-to-market implications.
8. **Theory-question auto-marking** — assumed to require human-in-the-loop review rather than full automation, given accuracy stakes for real exam scores.

---

*End of blueprint. This document is intended as a foundation — the next concrete steps are: (1) resolve the Assumptions Log items above, (2) confirm MVP scope with pilot-school commitments, (3) begin UX wireframing for the MVP feature set in section 17.*
