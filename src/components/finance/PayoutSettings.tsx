"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Payout {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export function PayoutSettings() {
  const [form, setForm] = useState<Payout>({ bankName: "", accountNumber: "", accountName: "" });
  const [saved, setSaved] = useState<Payout | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/school/payout-settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.payout) {
          setForm(d.payout);
          setSaved(d.payout);
        }
      })
      .catch(() => {});
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const res = await fetch("/api/school/payout-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return setError(data.error ?? "Could not save payout account.");
    setSaved(data.payout);
  }

  return (
    <Card className="mb-6">
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Payout Account</h2>
      <p className="mb-4 text-xs text-gray-500">
        Save the bank account collected fees should be paid into. Automatic payouts every 24 hours require a
        connected payment provider (Paystack/Flutterwave) — this saves your account details so they&apos;re ready
        the moment that&apos;s wired up; it doesn&apos;t move money on its own yet.
      </p>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input label="Bank name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} required />
        <Input
          label="Account number"
          value={form.accountNumber}
          onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
          required
        />
        <Input
          label="Account name"
          value={form.accountName}
          onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          required
        />
        <div className="sm:col-span-3">
          {error && <p className="mb-2 text-sm font-medium text-red-600">{error}</p>}
          {saved && !error && <p className="mb-2 text-sm font-medium text-green-700">Payout account saved.</p>}
          <Button type="submit" loading={saving}>
            Save payout account
          </Button>
        </div>
      </form>
    </Card>
  );
}
