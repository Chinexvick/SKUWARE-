"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Announcement {
  id: string;
  title: string;
  body: string;
  scope: string;
  publishedAt: string;
}

export function AnnouncementsClient() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", scope: "school" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/communication/announcements");
    const data = await res.json();
    if (res.ok) setAnnouncements(data.announcements);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function publish(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/communication/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not publish announcement.");
    setForm({ title: "", body: "", scope: "school" });
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        {loading ? (
          <LoadingSpinner size="sm" className="py-10" />
        ) : announcements.length === 0 ? (
          <p className="text-sm text-gray-500">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((a) => (
              <Card key={a.id}>
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-semibold text-black">{a.title}</h3>
                  <span className="rounded-full bg-brand-light px-2 py-0.5 text-xs font-semibold uppercase">{a.scope}</span>
                </div>
                <p className="text-sm text-gray-600">{a.body}</p>
                <p className="mt-2 text-xs text-gray-400">{new Date(a.publishedAt).toLocaleString()}</p>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">New Announcement</h3>
        <form onSubmit={publish} className="flex flex-col gap-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Body
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Scope
            <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="school">Whole school</option>
              <option value="class">Class</option>
              <option value="individual">Individual</option>
            </select>
          </label>
          <Button type="submit">Publish</Button>
        </form>
      </Card>
    </div>
  );
}
