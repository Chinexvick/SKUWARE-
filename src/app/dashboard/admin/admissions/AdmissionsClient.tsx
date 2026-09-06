"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Klass {
  id: string;
  name: string;
}
interface Application {
  id: string;
  applicantFirstName: string;
  applicantLastName: string;
  guardianName: string;
  guardianEmail: string;
  status: string;
  desiredClass: Klass | null;
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const emptyForm = { applicantFirstName: "", applicantLastName: "", guardianName: "", guardianEmail: "", guardianPhone: "", desiredClassId: "" };

export function AdmissionsClient() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [admissionNoDraft, setAdmissionNoDraft] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const [a, c] = await Promise.all([
      api<{ applications: Application[] }>("/api/admissions"),
      api<{ classes: Klass[] }>("/api/school/classes"),
    ]);
    if (a.ok) setApplications((a.data as { applications: Application[] }).applications);
    if (c.ok) setClasses((c.data as { classes: Klass[] }).classes);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createApplication(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/admissions", {
      method: "POST",
      body: JSON.stringify({ ...form, desiredClassId: form.desiredClassId || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not record application.");
    setForm(emptyForm);
    setShowForm(false);
    load();
  }

  async function decide(id: string, status: "APPROVED" | "REJECTED" | "UNDER_REVIEW") {
    setError(null);
    const body: Record<string, string> = { status };
    if (status === "APPROVED") {
      const admissionNo = admissionNoDraft[id];
      if (!admissionNo) return setError("Enter an admission number before approving.");
      body.admissionNo = admissionNo;
    }
    const { ok, data } = await api(`/api/admissions/${id}/decision`, { method: "POST", body: JSON.stringify(body) });
    if (!ok) return setError((data as { error: string }).error ?? "Could not update application.");
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{applications.length} applications</h2>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Record application"}
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={createApplication} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Applicant first name" required value={form.applicantFirstName} onChange={(e) => setForm({ ...form, applicantFirstName: e.target.value })} />
            <Input label="Applicant last name" required value={form.applicantLastName} onChange={(e) => setForm({ ...form, applicantLastName: e.target.value })} />
            <Input label="Guardian name" required value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
            <Input label="Guardian email" type="email" required value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
            <Input label="Guardian phone" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Desired class
              <select value={form.desiredClassId} onChange={(e) => setForm({ ...form, desiredClassId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Unspecified</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Save application</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Guardian</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">No applications yet.</td>
              </tr>
            ) : (
              applications.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {a.applicantLastName} {a.applicantFirstName}
                  </td>
                  <td className="px-4 py-3">
                    {a.guardianName}
                    <br />
                    <span className="text-xs text-gray-400">{a.guardianEmail}</span>
                  </td>
                  <td className="px-4 py-3">{a.desiredClass?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{a.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    {a.status !== "APPROVED" && a.status !== "REJECTED" && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <input
                          placeholder="Admission no."
                          value={admissionNoDraft[a.id] ?? ""}
                          onChange={(e) => setAdmissionNoDraft((m) => ({ ...m, [a.id]: e.target.value }))}
                          className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                        />
                        <button onClick={() => decide(a.id, "APPROVED")} className="rounded-lg bg-brand-yellow px-2 py-1 text-xs font-bold text-black">
                          Approve
                        </button>
                        <button onClick={() => decide(a.id, "REJECTED")} className="rounded-lg border border-black px-2 py-1 text-xs font-semibold text-black">
                          Reject
                        </button>
                      </div>
                    )}
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
