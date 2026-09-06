"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TeachingAssignment {
  id: string;
  subject: { id: string; name: string };
  class: { id: string; name: string };
  arm: { id: string; name: string } | null;
  term: { id: string; name: string; isCurrent: boolean };
}
interface Homework {
  id: string;
  title: string;
  dueDate: string;
  subject: { name: string };
  class: { name: string };
  arm: { name: string } | null;
  _count: { submissions: number };
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function TeacherAssignmentsClient() {
  const [teaching, setTeaching] = useState<TeachingAssignment[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeachingId, setSelectedTeachingId] = useState("");
  const [form, setForm] = useState({ title: "", instructions: "", dueDate: "" });

  async function load() {
    setLoading(true);
    const [t, h] = await Promise.all([
      api<{ assignments: TeachingAssignment[] }>("/api/academics/assignments"),
      api<{ assignments: Homework[] }>("/api/assignments"),
    ]);
    if (t.ok) setTeaching((t.data as { assignments: TeachingAssignment[] }).assignments);
    if (h.ok) setHomework((h.data as { assignments: Homework[] }).assignments);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createHomework(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const selected = teaching.find((t) => t.id === selectedTeachingId);
    if (!selected) return setError("Select a class to assign homework to.");
    const { ok, data } = await api("/api/assignments", {
      method: "POST",
      body: JSON.stringify({
        title: form.title,
        instructions: form.instructions,
        subjectId: selected.subject.id,
        classId: selected.class.id,
        armId: selected.arm?.id,
        termId: selected.term.id,
        dueDate: form.dueDate,
      }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create assignment.");
    setForm({ title: "", instructions: "", dueDate: "" });
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
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Class</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3">Submissions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Loading…</td>
                </tr>
              ) : homework.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No assignments yet.</td>
                </tr>
              ) : (
                homework.map((h) => (
                  <tr key={h.id}>
                    <td className="px-4 py-3 font-medium text-black">{h.title}</td>
                    <td className="px-4 py-3">
                      {h.class.name}
                      {h.arm ? ` ${h.arm.name}` : ""} — {h.subject.name}
                    </td>
                    <td className="px-4 py-3">{new Date(h.dueDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3">{h._count.submissions}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="h-fit">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Assignment</h3>
        <form onSubmit={createHomework} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Class
            <select required value={selectedTeachingId} onChange={(e) => setSelectedTeachingId(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="">Select…</option>
              {teaching.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.subject.name} — {t.class.name}
                  {t.arm ? ` ${t.arm.name}` : ""} ({t.term.name})
                </option>
              ))}
            </select>
          </label>
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Instructions
            <textarea required rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm" />
          </label>
          <Input label="Due date" type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <Button type="submit">Create assignment</Button>
        </form>
      </Card>
    </div>
  );
}
