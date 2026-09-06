"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Arm {
  id: string;
  name: string;
}
interface Klass {
  id: string;
  name: string;
  arms: Arm[];
}
interface Subject {
  id: string;
  name: string;
}
interface Term {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface Session {
  id: string;
  terms: Term[];
}
interface StaffMember {
  id: string;
  user: { firstName: string; lastName: string; role: string };
}
interface Assignment {
  id: string;
  teacher: { user: { firstName: string; lastName: string } };
  subject: { name: string };
  class: { name: string };
  arm: { name: string } | null;
  term: { name: string };
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AssignmentsPanel({ canEdit }: { canEdit: boolean }) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [teachers, setTeachers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ teacherId: "", subjectId: "", classId: "", armId: "", termId: "" });

  async function load() {
    setLoading(true);
    const [a, c, s, sess, st] = await Promise.all([
      api<{ assignments: Assignment[] }>("/api/academics/assignments"),
      api<{ classes: Klass[] }>("/api/school/classes"),
      api<{ subjects: Subject[] }>("/api/school/subjects"),
      api<{ sessions: Session[] }>("/api/school/sessions"),
      api<{ staff: StaffMember[] }>("/api/people/staff"),
    ]);
    if (a.ok) setAssignments((a.data as { assignments: Assignment[] }).assignments);
    if (c.ok) setClasses((c.data as { classes: Klass[] }).classes);
    if (s.ok) setSubjects((s.data as { subjects: Subject[] }).subjects);
    if (sess.ok) setTerms((sess.data as { sessions: Session[] }).sessions.flatMap((x) => x.terms));
    if (st.ok) setTeachers((st.data as { staff: StaffMember[] }).staff.filter((m) => m.user.role === "TEACHER"));
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  const selectedClass = classes.find((c) => c.id === form.classId);

  async function createAssignment(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/academics/assignments", {
      method: "POST",
      body: JSON.stringify({ ...form, armId: form.armId || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create assignment.");
    setForm({ teacherId: "", subjectId: "", classId: "", armId: "", termId: "" });
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Teacher</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Term</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    No assignments yet.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-black">
                      {a.teacher.user.lastName} {a.teacher.user.firstName}
                    </td>
                    <td className="px-4 py-3">{a.subject.name}</td>
                    <td className="px-4 py-3">
                      {a.class.name}
                      {a.arm ? ` ${a.arm.name}` : ""}
                    </td>
                    <td className="px-4 py-3">{a.term.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      {canEdit && (
        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Assignment</h3>
          <form onSubmit={createAssignment} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Teacher
              <select required value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select…</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.user.lastName} {t.user.firstName}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Subject
              <select required value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Class
              <select required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, armId: "" })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedClass && selectedClass.arms.length > 0 && (
              <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
                Arm (optional — leave blank for all arms)
                <select value={form.armId} onChange={(e) => setForm({ ...form, armId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                  <option value="">All arms</option>
                  {selectedClass.arms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Term
              <select required value={form.termId} onChange={(e) => setForm({ ...form, termId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select…</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isCurrent ? "(current)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Create assignment</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
