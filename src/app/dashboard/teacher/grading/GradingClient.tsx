"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}
interface Component {
  id: string;
  name: string;
  maxScore: number;
}
interface ScoreRecord {
  studentId: string;
  componentId: string;
  score: number;
}
interface Assignment {
  id: string;
  subjectId: string;
  subject: { name: string };
  class: { name: string };
  arm: { name: string } | null;
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function GradingClient() {
  const params = useSearchParams();
  const assignmentId = params.get("assignmentId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!assignmentId) return;
    const t = setTimeout(async () => {
      setLoading(true);
      const { ok, data } = await api<{
        assignment: Assignment;
        students: Student[];
        components: Component[];
        scores: ScoreRecord[];
      }>(`/api/academics/scores?assignmentId=${assignmentId}`);
      if (ok) {
        const d = data as { assignment: Assignment; students: Student[]; components: Component[]; scores: ScoreRecord[] };
        setAssignment(d.assignment);
        setStudents(d.students);
        setComponents(d.components);
        const grid: Record<string, Record<string, string>> = {};
        for (const s of d.scores) {
          grid[s.studentId] = { ...(grid[s.studentId] ?? {}), [s.componentId]: String(s.score) };
        }
        setValues(grid);
      } else {
        setError((data as { error: string }).error ?? "Could not load class.");
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, [assignmentId]);

  function setCell(studentId: string, componentId: string, value: string) {
    setValues((v) => ({ ...v, [studentId]: { ...(v[studentId] ?? {}), [componentId]: value } }));
  }

  async function save() {
    if (!assignmentId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const entries = students.flatMap((s) =>
      components
        .map((c) => ({ studentId: s.id, componentId: c.id, score: values[s.id]?.[c.id] }))
        .filter((e) => e.score !== undefined && e.score !== "")
        .map((e) => ({ studentId: e.studentId, componentId: e.componentId, score: Number(e.score) })),
    );
    if (entries.length === 0) {
      setSaving(false);
      return;
    }
    const { ok, data } = await api("/api/academics/scores", {
      method: "POST",
      body: JSON.stringify({ assignmentId, entries }),
    });
    if (!ok) setError((data as { error: string }).error ?? "Could not save scores.");
    else setSaved(true);
    setSaving(false);
  }

  async function saveComment(studentId: string) {
    if (!assignmentId) return;
    const comment = comments[studentId]?.trim();
    if (!comment) return;
    await api("/api/academics/comments", {
      method: "POST",
      body: JSON.stringify({ assignmentId, studentId, comment }),
    });
  }

  if (!assignmentId) {
    return <p className="text-sm text-gray-500">Choose a class from &quot;My Classes&quot; to enter scores.</p>;
  }
  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>;

  return (
    <div>
      {assignment && (
        <h2 className="mb-4 text-sm font-semibold text-gray-500">
          {assignment.subject.name} — {assignment.class.name}
          {assignment.arm ? ` ${assignment.arm.name}` : ""}
        </h2>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              {components.map((c) => (
                <th key={c.id} className="px-4 py-3">
                  {c.name} (/{c.maxScore})
                </th>
              ))}
              <th className="px-4 py-3">Comment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {students.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-black">
                  {s.lastName} {s.firstName}
                </td>
                {components.map((c) => (
                  <td key={c.id} className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      max={c.maxScore}
                      value={values[s.id]?.[c.id] ?? ""}
                      onChange={(e) => setCell(s.id, c.id, e.target.value)}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                    />
                  </td>
                ))}
                <td className="px-4 py-2">
                  <input
                    placeholder="Optional remark…"
                    value={comments[s.id] ?? ""}
                    onChange={(e) => setComments((c) => ({ ...c, [s.id]: e.target.value }))}
                    onBlur={() => saveComment(s.id)}
                    className="w-48 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4 flex items-center gap-3">
        <Button onClick={save} loading={saving}>
          Save scores
        </Button>
        {saved && <span className="text-sm font-medium text-green-700">Saved.</span>}
      </div>
    </div>
  );
}
