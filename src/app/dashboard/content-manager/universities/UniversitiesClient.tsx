"use client";

import { useEffect, useState, FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface University {
  id: string;
  name: string;
  state: string | null;
  type: string | null;
  courses: { id: string; name: string }[];
}

export function UniversitiesClient() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", state: "", type: "federal" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/content/universities");
    const data = await res.json();
    if (res.ok) setUniversities(data.universities);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/content/universities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error ?? "Could not create university.");
    setForm({ name: "", state: "", type: "federal" });
    load();
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : universities.length === 0 ? (
          <p className="text-sm text-gray-500">No universities added yet.</p>
        ) : (
          <div className="space-y-3">
            {universities.map((u) => (
              <Card key={u.id}>
                <h3 className="font-semibold text-black">{u.name}</h3>
                <p className="text-xs text-gray-500">
                  {u.state ?? "—"} · {u.type ?? "—"} · {u.courses.length} courses
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Card className="h-fit">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Add University</h3>
        <form onSubmit={create} className="flex flex-col gap-3">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="federal">Federal</option>
              <option value="state">State</option>
              <option value="private">Private</option>
            </select>
          </label>
          <Button type="submit">Add university</Button>
        </form>
        <p className="mt-3 text-xs text-gray-500">
          Course-level admission requirements management is next; this seeds the university list so it&apos;s ready
          when that&apos;s wired up.
        </p>
      </Card>
    </div>
  );
}
