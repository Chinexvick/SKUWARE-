"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AssignmentsPanel } from "./AssignmentsPanel";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Term {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  resultsPublished: boolean;
}
interface Session {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  terms: Term[];
}
interface Arm {
  id: string;
  name: string;
}
interface Klass {
  id: string;
  name: string;
  arms: Arm[];
  _count: { students: number };
}
interface Department {
  id: string;
  name: string;
}
interface Subject {
  id: string;
  name: string;
  code: string | null;
  department: Department | null;
}

const TABS = ["Sessions & Terms", "Classes & Arms", "Departments", "Subjects", "Teacher Assignments"] as const;
type Tab = (typeof TABS)[number];

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AcademicsClient({ canEdit }: { canEdit: boolean }) {
  const [tab, setTab] = useState<Tab>("Sessions & Terms");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold transition ${
              tab === t ? "border-b-2 border-brand-yellow text-black" : "text-gray-500 hover:text-black"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Sessions & Terms" && <SessionsPanel canEdit={canEdit} />}
      {tab === "Classes & Arms" && <ClassesPanel canEdit={canEdit} />}
      {tab === "Departments" && <DepartmentsPanel canEdit={canEdit} />}
      {tab === "Subjects" && <SubjectsPanel canEdit={canEdit} />}
      {tab === "Teacher Assignments" && <AssignmentsPanel canEdit={canEdit} />}
    </div>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>;
}

function SessionsPanel({ canEdit }: { canEdit: boolean }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", startDate: "", endDate: "" });
  const [termForm, setTermForm] = useState<Record<string, { name: string; startDate: string; endDate: string }>>({});
  const [publishing, setPublishing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { ok, data } = await api<{ sessions: Session[] }>("/api/school/sessions");
    if (ok) setSessions((data as { sessions: Session[] }).sessions);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createSession(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/school/sessions", { method: "POST", body: JSON.stringify(form) });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create session.");
    setForm({ name: "", startDate: "", endDate: "" });
    load();
  }

  async function createTerm(sessionId: string, e: FormEvent) {
    e.preventDefault();
    setError(null);
    const values = termForm[sessionId] ?? { name: "", startDate: "", endDate: "" };
    const { ok, data } = await api("/api/school/terms", {
      method: "POST",
      body: JSON.stringify({ sessionId, ...values }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create term.");
    setTermForm((f) => ({ ...f, [sessionId]: { name: "", startDate: "", endDate: "" } }));
    load();
  }

  async function togglePublish(termId: string, publish: boolean) {
    setPublishing(termId);
    setError(null);
    const { ok, data } = await api(`/api/academics/terms/${termId}/publish-results`, {
      method: "PATCH",
      body: JSON.stringify({ publish }),
    });
    setPublishing(null);
    if (!ok) return setError((data as { error: string }).error ?? "Could not update publish status.");
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <ErrorText error={error} />
        {loading ? (
          <LoadingSpinner size="sm" className="py-10" />
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No academic sessions yet.</p>
        ) : (
          sessions.map((s) => (
            <Card key={s.id}>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-black">
                    {s.name} {s.isCurrent && <span className="ml-2 rounded bg-brand-yellow px-2 py-0.5 text-xs font-bold">CURRENT</span>}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {new Date(s.startDate).toLocaleDateString()} – {new Date(s.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <ul className="mb-3 divide-y divide-gray-100">
                {s.terms.map((t) => (
                  <li key={t.id} className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="flex items-center gap-2">
                      {t.name}
                      {t.isCurrent && <span className="text-xs font-semibold text-black">(current)</span>}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          t.resultsPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {t.resultsPublished ? "Results published" : "Results in draft"}
                      </span>
                    </span>
                    {canEdit && (
                      <Button
                        variant="secondary"
                        className="w-full px-2.5 py-1 text-xs sm:w-auto"
                        loading={publishing === t.id}
                        onClick={() => togglePublish(t.id, !t.resultsPublished)}
                      >
                        {t.resultsPublished ? "Unpublish results" : "Publish results"}
                      </Button>
                    )}
                  </li>
                ))}
                {s.terms.length === 0 && <li className="py-2 text-sm text-gray-400">No terms yet.</li>}
              </ul>
              {canEdit && (
                <form onSubmit={(e) => createTerm(s.id, e)} className="grid grid-cols-4 gap-2">
                  <input
                    placeholder="Term name"
                    required
                    value={termForm[s.id]?.name ?? ""}
                    onChange={(e) => setTermForm((f) => ({ ...f, [s.id]: { ...f[s.id], name: e.target.value, startDate: f[s.id]?.startDate ?? "", endDate: f[s.id]?.endDate ?? "" } }))}
                    className="col-span-2 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    required
                    value={termForm[s.id]?.startDate ?? ""}
                    onChange={(e) => setTermForm((f) => ({ ...f, [s.id]: { ...f[s.id], name: f[s.id]?.name ?? "", startDate: e.target.value, endDate: f[s.id]?.endDate ?? "" } }))}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <input
                    type="date"
                    required
                    value={termForm[s.id]?.endDate ?? ""}
                    onChange={(e) => setTermForm((f) => ({ ...f, [s.id]: { ...f[s.id], name: f[s.id]?.name ?? "", startDate: f[s.id]?.startDate ?? "", endDate: e.target.value } }))}
                    className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <Button type="submit" variant="secondary" className="col-span-4">
                    Add term
                  </Button>
                </form>
              )}
            </Card>
          ))
        )}
      </div>

      {canEdit && (
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Academic Session</h3>
          <form onSubmit={createSession} className="flex flex-col gap-3">
            <Input label="Name" placeholder="2025/2026" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Start date" type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End date" type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            <Button type="submit">Create session</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function ClassesPanel({ canEdit }: { canEdit: boolean }) {
  const [classes, setClasses] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [armForm, setArmForm] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const { ok, data } = await api<{ classes: Klass[] }>("/api/school/classes");
    if (ok) setClasses((data as { classes: Klass[] }).classes);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createClass(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/school/classes", { method: "POST", body: JSON.stringify({ name }) });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create class.");
    setName("");
    load();
  }

  async function createArm(classId: string, e: FormEvent) {
    e.preventDefault();
    setError(null);
    const armName = armForm[classId] ?? "";
    const { ok, data } = await api(`/api/school/classes/${classId}/arms`, {
      method: "POST",
      body: JSON.stringify({ name: armName }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create arm.");
    setArmForm((f) => ({ ...f, [classId]: "" }));
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        <ErrorText error={error} />
        {loading ? (
          <LoadingSpinner size="sm" className="py-10" />
        ) : classes.length === 0 ? (
          <p className="text-sm text-gray-500">No classes yet.</p>
        ) : (
          classes.map((c) => (
            <Card key={c.id}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-black">{c.name}</h3>
                <span className="text-xs text-gray-500">{c._count.students} students</span>
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                {c.arms.map((a) => (
                  <span key={a.id} className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium">
                    {a.name}
                  </span>
                ))}
                {c.arms.length === 0 && <span className="text-xs text-gray-400">No arms yet.</span>}
              </div>
              {canEdit && (
                <form onSubmit={(e) => createArm(c.id, e)} className="flex gap-2">
                  <input
                    placeholder="Arm name (e.g. A)"
                    required
                    value={armForm[c.id] ?? ""}
                    onChange={(e) => setArmForm((f) => ({ ...f, [c.id]: e.target.value }))}
                    className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <Button type="submit" variant="secondary">
                    Add arm
                  </Button>
                </form>
              )}
            </Card>
          ))
        )}
      </div>

      {canEdit && (
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Class</h3>
          <form onSubmit={createClass} className="flex flex-col gap-3">
            <Input label="Class name" placeholder="JSS 1" required value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit">Create class</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function DepartmentsPanel({ canEdit }: { canEdit: boolean }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  async function load() {
    setLoading(true);
    const { ok, data } = await api<{ departments: Department[] }>("/api/school/departments");
    if (ok) setDepartments((data as { departments: Department[] }).departments);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createDepartment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/school/departments", { method: "POST", body: JSON.stringify({ name }) });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create department.");
    setName("");
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ErrorText error={error} />
        <Card>
          {loading ? (
            <LoadingSpinner size="sm" className="py-10" />
          ) : departments.length === 0 ? (
            <p className="text-sm text-gray-500">No departments yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {departments.map((d) => (
                <li key={d.id} className="py-2 text-sm font-medium text-black">
                  {d.name}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {canEdit && (
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Department</h3>
          <form onSubmit={createDepartment} className="flex flex-col gap-3">
            <Input label="Department name" placeholder="Sciences" required value={name} onChange={(e) => setName(e.target.value)} />
            <Button type="submit">Create department</Button>
          </form>
        </Card>
      )}
    </div>
  );
}

function SubjectsPanel({ canEdit }: { canEdit: boolean }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", code: "", departmentId: "" });

  async function load() {
    setLoading(true);
    const [s, d] = await Promise.all([
      api<{ subjects: Subject[] }>("/api/school/subjects"),
      api<{ departments: Department[] }>("/api/school/departments"),
    ]);
    if (s.ok) setSubjects((s.data as { subjects: Subject[] }).subjects);
    if (d.ok) setDepartments((d.data as { departments: Department[] }).departments);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createSubject(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/school/subjects", {
      method: "POST",
      body: JSON.stringify({ ...form, departmentId: form.departmentId || undefined, code: form.code || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create subject.");
    setForm({ name: "", code: "", departmentId: "" });
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <ErrorText error={error} />
        <Card>
          {loading ? (
            <LoadingSpinner size="sm" className="py-10" />
          ) : subjects.length === 0 ? (
            <p className="text-sm text-gray-500">No subjects yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {subjects.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium text-black">
                    {s.name} {s.code && <span className="text-gray-400">({s.code})</span>}
                  </span>
                  <span className="text-xs text-gray-500">{s.department?.name ?? "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      {canEdit && (
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Subject</h3>
          <form onSubmit={createSubject} className="flex flex-col gap-3">
            <Input label="Subject name" placeholder="Mathematics" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Code (optional)" placeholder="MTH" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Department (optional)
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
              >
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Create subject</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
