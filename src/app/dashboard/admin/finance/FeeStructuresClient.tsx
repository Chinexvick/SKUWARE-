"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Term {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface Session {
  id: string;
  terms: Term[];
}
interface Klass {
  id: string;
  name: string;
}
interface FeeStructure {
  id: string;
  name: string;
  amount: number;
  term: { name: string };
  class: { name: string } | null;
}
interface Invoice {
  id: string;
  description: string;
  amountDue: number;
  amountPaid: number;
  status: string;
  student: { firstName: string; lastName: string; admissionNo: string };
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const naira = (n: number) => `₦${n.toLocaleString()}`;

export function FeeStructuresClient() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<Klass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", termId: "", classId: "" });

  async function load() {
    setLoading(true);
    const [s, i, sess, c] = await Promise.all([
      api<{ structures: FeeStructure[] }>("/api/fees/structures"),
      api<{ invoices: Invoice[] }>("/api/fees/invoices"),
      api<{ sessions: Session[] }>("/api/school/sessions"),
      api<{ classes: Klass[] }>("/api/school/classes"),
    ]);
    if (s.ok) setStructures((s.data as { structures: FeeStructure[] }).structures);
    if (i.ok) setInvoices((i.data as { invoices: Invoice[] }).invoices);
    if (sess.ok) setTerms((sess.data as { sessions: Session[] }).sessions.flatMap((x) => x.terms));
    if (c.ok) setClasses((c.data as { classes: Klass[] }).classes);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function createStructure(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { ok, data } = await api("/api/fees/structures", {
      method: "POST",
      body: JSON.stringify({ ...form, classId: form.classId || undefined }),
    });
    if (!ok) return setError((data as { error: string }).error ?? "Could not create fee structure.");
    setForm({ name: "", amount: "", termId: "", classId: "" });
    load();
  }

  const collected = invoices.reduce((sum, i) => sum + i.amountPaid, 0);
  const outstanding = invoices.reduce((sum, i) => sum + (i.amountDue - i.amountPaid), 0);

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Fees Collected" value={naira(collected)} />
        <StatCard label="Outstanding" value={naira(outstanding)} />
        <StatCard label="Invoices Issued" value={invoices.length} />
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-x-auto p-0">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-black">Fee Structures</div>
            <table className="w-full text-sm">
              <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Term</th>
                  <th className="px-4 py-3">Class</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Loading…</td>
                  </tr>
                ) : structures.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">No fee structures yet.</td>
                  </tr>
                ) : (
                  structures.map((s) => (
                    <tr key={s.id}>
                      <td className="px-4 py-3 font-medium text-black">{s.name}</td>
                      <td className="px-4 py-3">{naira(s.amount)}</td>
                      <td className="px-4 py-3">{s.term.name}</td>
                      <td className="px-4 py-3">{s.class?.name ?? "All classes"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>

          <Card className="overflow-x-auto p-0">
            <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-black">Recent Invoices</div>
            <table className="w-full text-sm">
              <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Due</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.slice(0, 20).map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3 font-medium text-black">
                      {i.student.lastName} {i.student.firstName}
                    </td>
                    <td className="px-4 py-3">{i.description}</td>
                    <td className="px-4 py-3">{naira(i.amountDue)}</td>
                    <td className="px-4 py-3">{naira(i.amountPaid)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold">{i.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <Card className="h-fit">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Fee Structure</h3>
          <form onSubmit={createStructure} className="flex flex-col gap-3">
            <Input label="Name" placeholder="Tuition" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Amount (₦)" type="number" min={1} required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
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
            <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
              Class (optional)
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Create fee structure</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
