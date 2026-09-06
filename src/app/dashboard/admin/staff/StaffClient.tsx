"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Department {
  id: string;
  name: string;
}
interface StaffMember {
  id: string;
  designation: string | null;
  department: Department | null;
  user: { firstName: string; lastName: string; email: string; role: string; status: string };
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const ROLE_OPTIONS = ["TEACHER", "STAFF", "BURSAR", "VICE_PRINCIPAL", "PRINCIPAL", "GATE_STAFF"] as const;

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  role: "TEACHER" as (typeof ROLE_OPTIONS)[number],
  designation: "",
  departmentId: "",
};

export function StaffClient({ canEdit }: { canEdit: boolean }) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [invite, setInvite] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    const [s, d] = await Promise.all([
      api<{ staff: StaffMember[] }>("/api/people/staff"),
      api<{ departments: Department[] }>("/api/school/departments"),
    ]);
    if (s.ok) setStaff((s.data as { staff: StaffMember[] }).staff);
    if (d.ok) setDepartments((d.data as { departments: Department[] }).departments);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createStaff(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInvite(null);
    const { ok, data } = await api<{ temporaryPassword: string }>("/api/people/staff", {
      method: "POST",
      body: JSON.stringify({ ...form, departmentId: form.departmentId || undefined, designation: form.designation || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create staff account.");
    setInvite({ email: form.email, password: (data as { temporaryPassword: string }).temporaryPassword });
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{staff.length} staff members</h2>
        {canEdit && (
          <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add staff"}
          </Button>
        )}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {invite && (
        <Card className="mb-4 border-2 border-brand-yellow">
          <p className="text-sm font-semibold text-black">Account created for {invite.email}</p>
          <p className="mt-1 text-sm text-gray-600">
            Temporary password: <code className="rounded bg-brand-light px-2 py-0.5 font-mono">{invite.password}</code>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            No email provider is wired up yet — share this with the staff member directly and ask them to change it
            after first login.
          </p>
        </Card>
      )}

      {showForm && canEdit && (
        <Card className="mb-6">
          <form onSubmit={createStaff} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Role
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Designation (optional)" placeholder="Head of Mathematics" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Department (optional)
              <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">None</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Create staff account</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                  No staff yet.
                </td>
              </tr>
            ) : (
              staff.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {s.user.lastName} {s.user.firstName}
                  </td>
                  <td className="px-4 py-3">{s.user.role.replace("_", " ")}</td>
                  <td className="px-4 py-3">{s.department?.name ?? "—"}</td>
                  <td className="px-4 py-3">{s.user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        s.user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.user.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
