"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Klass {
  id: string;
  name: string;
}
interface Student {
  id: string;
  firstName: string;
  lastName: string;
}
interface AttendanceRecord {
  studentId: string;
  status: string;
}

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function AttendanceClient() {
  const [classes, setClasses] = useState<Klass[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const { ok, data } = await api<{ classes: Klass[] }>("/api/school/classes");
      if (ok) setClasses((data as { classes: Klass[] }).classes);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!classId || !date) return;
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      setSaved(false);
      const { ok, data } = await api<{ students: Student[]; records: AttendanceRecord[] }>(
        `/api/attendance?classId=${classId}&date=${date}`,
      );
      if (ok) {
        const d = data as { students: Student[]; records: AttendanceRecord[] };
        setStudents(d.students);
        const map: Record<string, string> = {};
        for (const r of d.records) map[r.studentId] = r.status;
        setStatuses(map);
      } else {
        setError((data as { error: string }).error ?? "Could not load register.");
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, [classId, date]);

  async function save() {
    setSaving(true);
    setError(null);
    const entries = students
      .filter((s) => statuses[s.id])
      .map((s) => ({ studentId: s.id, status: statuses[s.id] }));
    const { ok, data } = await api("/api/attendance", {
      method: "POST",
      body: JSON.stringify({ classId, date, entries }),
    });
    if (!ok) setError((data as { error: string }).error ?? "Could not save attendance.");
    else setSaved(true);
    setSaving(false);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
          Class
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm" />
        </label>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {!classId ? (
        <p className="text-sm text-gray-500">Choose a class to take or review attendance.</p>
      ) : loading ? (
        <LoadingSpinner size="sm" className="py-10" />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 font-medium text-black">
                      {s.lastName} {s.firstName}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1.5">
                        {STATUSES.map((st) => (
                          <button
                            key={st}
                            onClick={() => setStatuses((m) => ({ ...m, [s.id]: st }))}
                            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                              statuses[s.id] === st ? "bg-brand-yellow text-black" : "bg-brand-light text-gray-500 hover:text-black"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="mt-4 flex items-center gap-3">
            <Button onClick={save} loading={saving}>
              Save attendance
            </Button>
            {saved && <span className="text-sm font-medium text-green-700">Saved.</span>}
          </div>
        </>
      )}
    </div>
  );
}
