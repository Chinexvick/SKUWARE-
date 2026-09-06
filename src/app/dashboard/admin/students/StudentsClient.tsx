"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";

interface Arm {
  id: string;
  name: string;
}
interface Klass {
  id: string;
  name: string;
  arms: Arm[];
}
interface Student {
  id: string;
  admissionNo: string;
  firstName: string;
  lastName: string;
  gender: string | null;
  class: { name: string } | null;
  arm: { name: string } | null;
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const emptyForm = {
  admissionNo: "",
  firstName: "",
  lastName: "",
  gender: "",
  dateOfBirth: "",
  classId: "",
  armId: "",
  email: "",
};

export function StudentsClient({ canEdit }: { canEdit: boolean }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [invite, setInvite] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    const [s, c] = await Promise.all([
      api<{ students: Student[] }>(`/api/people/students${search ? `?q=${encodeURIComponent(search)}` : ""}`),
      api<{ classes: Klass[] }>("/api/school/classes"),
    ]);
    if (s.ok) setStudents((s.data as { students: Student[] }).students);
    if (c.ok) setClasses((c.data as { classes: Klass[] }).classes);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selectedClass = classes.find((c) => c.id === form.classId);

  async function createStudent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInvite(null);
    const { ok, data } = await api<{ temporaryPassword?: string }>("/api/people/students", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        gender: form.gender || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        classId: form.classId || undefined,
        armId: form.armId || undefined,
        email: form.email || undefined,
      }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create student.");
    const temporaryPassword = (data as { temporaryPassword?: string }).temporaryPassword;
    if (temporaryPassword && form.email) {
      setInvite({ email: form.email, password: temporaryPassword });
    }
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          placeholder="Search by name or admission number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2 text-sm sm:max-w-sm"
        />
        {canEdit && (
          <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add student"}
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {invite && (
        <Card className="mb-4 border-2 border-brand-yellow">
          <p className="text-sm font-semibold text-black">Login account created for {invite.email}</p>
          <p className="mt-1 text-sm text-gray-600">
            Temporary password: <code className="rounded bg-brand-light px-2 py-0.5 font-mono">{invite.password}</code>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            No email provider is wired up yet — share this with the student directly and ask them to change it after
            first login.
          </p>
        </Card>
      )}

      {showForm && canEdit && (
        <Card className="mb-6">
          <form onSubmit={createStudent} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Admission number" required value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Gender
              <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Unspecified</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </label>
            <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Class
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value, armId: "" })}
                className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
              >
                <option value="">Unassigned</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {selectedClass && selectedClass.arms.length > 0 && (
              <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
                Arm
                <select value={form.armId} onChange={(e) => setForm({ ...form, armId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                  <option value="">Unassigned</option>
                  {selectedClass.arms.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="sm:col-span-2 lg:col-span-3">
              <Input
                label="Email (optional — creates a student login)"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Save student</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Admission No.</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Gender</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState pose="empty" title="No students found" />
                </td>
              </tr>
            ) : (
              students.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-black">{s.admissionNo}</td>
                  <td className="px-4 py-3">
                    {s.lastName} {s.firstName}
                  </td>
                  <td className="px-4 py-3">
                    {s.class ? `${s.class.name}${s.arm ? ` ${s.arm.name}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-3">{s.gender ?? "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
