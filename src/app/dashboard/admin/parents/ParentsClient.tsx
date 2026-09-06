"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ParentRecord {
  id: string;
  user: { firstName: string; lastName: string; email: string; status: string };
  childLinks: { student: { firstName: string; lastName: string; admissionNo: string } }[];
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const emptyForm = { firstName: "", lastName: "", email: "", phone: "", admissionNumbers: "" };

export function ParentsClient({ canEdit }: { canEdit: boolean }) {
  const [parents, setParents] = useState<ParentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [invite, setInvite] = useState<{ email: string; password: string } | null>(null);

  async function load() {
    setLoading(true);
    const { ok, data } = await api<{ parents: ParentRecord[] }>("/api/people/parents");
    if (ok) setParents((data as { parents: ParentRecord[] }).parents);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createParent(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInvite(null);
    const studentAdmissionNos = form.admissionNumbers
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { ok, data } = await api<{ temporaryPassword: string }>("/api/people/parents", {
      method: "POST",
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        studentAdmissionNos,
      }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create parent account.");
    setInvite({ email: form.email, password: (data as { temporaryPassword: string }).temporaryPassword });
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{parents.length} parent accounts</h2>
        {canEdit && (
          <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "Add parent"}
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
            No email provider is wired up yet — share this with the parent directly and ask them to change it after
            first login.
          </p>
        </Card>
      )}

      {showForm && canEdit && (
        <Card className="mb-6">
          <form onSubmit={createParent} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <Input label="Last name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Input label="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <div className="sm:col-span-2">
              <Input
                label="Children's admission numbers (comma-separated, optional)"
                placeholder="STU-0001, STU-0002"
                value={form.admissionNumbers}
                onChange={(e) => setForm({ ...form, admissionNumbers: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Create parent account</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Children</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : parents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No parents yet.
                </td>
              </tr>
            ) : (
              parents.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {p.user.lastName} {p.user.firstName}
                  </td>
                  <td className="px-4 py-3">{p.user.email}</td>
                  <td className="px-4 py-3">
                    {p.childLinks.length === 0
                      ? "—"
                      : p.childLinks.map((l) => `${l.student.firstName} ${l.student.lastName}`).join(", ")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        p.user.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {p.user.status}
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
