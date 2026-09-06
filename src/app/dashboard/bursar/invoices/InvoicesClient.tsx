"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}
interface Invoice {
  id: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  student: Student;
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const naira = (n: number) => `₦${n.toLocaleString()}`;

export function InvoicesClient() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ studentId: "", description: "", amountDue: "" });
  const [payForm, setPayForm] = useState<Record<string, { amount: string; method: string; reference: string }>>({});

  async function load() {
    setLoading(true);
    const [i, s] = await Promise.all([
      api<{ invoices: Invoice[] }>("/api/fees/invoices"),
      api<{ students: Student[] }>("/api/people/students"),
    ]);
    if (i.ok) setInvoices((i.data as { invoices: Invoice[] }).invoices);
    if (s.ok) setStudents((s.data as { students: Student[] }).students);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/fees/invoices", { method: "POST", body: JSON.stringify(form) });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create invoice.");
    setForm({ studentId: "", description: "", amountDue: "" });
    setShowForm(false);
    load();
  }

  async function recordPayment(invoiceId: string) {
    setError(null);
    const values = payForm[invoiceId];
    if (!values?.amount) return;
    const { ok, data } = await api("/api/fees/payments", {
      method: "POST",
      body: JSON.stringify({ invoiceId, amount: Number(values.amount), method: values.method || "CASH", reference: values.reference || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not record payment.");
    setPayForm((f) => ({ ...f, [invoiceId]: { amount: "", method: "CASH", reference: "" } }));
    load();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-sm font-semibold text-gray-500">{invoices.length} invoices</h2>
        <Button className="w-full sm:w-auto" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "New invoice"}
        </Button>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {showForm && (
        <Card className="mb-6">
          <form onSubmit={createInvoice} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black sm:col-span-2">
              Student
              <select required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">Select…</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.admissionNo} — {s.lastName} {s.firstName}
                  </option>
                ))}
              </select>
            </label>
            <Input label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Amount due (₦)" type="number" min={1} required value={form.amountDue} onChange={(e) => setForm({ ...form, amountDue: e.target.value })} />
            <div className="sm:col-span-2 lg:col-span-4">
              <Button type="submit">Create invoice</Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Record Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No invoices yet.</td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {inv.student.lastName} {inv.student.firstName}
                  </td>
                  <td className="px-4 py-3">{inv.description}</td>
                  <td className="px-4 py-3">{naira(inv.amountDue)}</td>
                  <td className="px-4 py-3">{naira(inv.amountPaid)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{inv.status}</span>
                  </td>
                  <td className="px-4 py-2">
                    {inv.status !== "PAID" && (
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          placeholder="Amount"
                          min={1}
                          value={payForm[inv.id]?.amount ?? ""}
                          onChange={(e) => setPayForm((f) => ({ ...f, [inv.id]: { ...(f[inv.id] ?? { method: "CASH", reference: "" }), amount: e.target.value } }))}
                          className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-xs"
                        />
                        <select
                          value={payForm[inv.id]?.method ?? "CASH"}
                          onChange={(e) => setPayForm((f) => ({ ...f, [inv.id]: { ...(f[inv.id] ?? { amount: "", reference: "" }), method: e.target.value } }))}
                          className="rounded-lg border border-gray-300 px-1 py-1 text-xs"
                        >
                          <option value="CASH">Cash</option>
                          <option value="BANK_TRANSFER">Bank Transfer</option>
                          <option value="CARD">Card</option>
                          <option value="USSD">USSD</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <button onClick={() => recordPayment(inv.id)} className="rounded-lg bg-brand-yellow px-2 py-1 text-xs font-bold text-black">
                          Record
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
