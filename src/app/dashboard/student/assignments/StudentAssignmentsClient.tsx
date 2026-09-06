"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Assignment {
  id: string;
  title: string;
  instructions: string;
  dueDate: string;
  subject: { name: string };
  submissions: { content: string | null; submittedAt: string }[];
}

export function StudentAssignmentsClient() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/assignments");
    const data = await res.json();
    if (res.ok) setAssignments(data.assignments);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function submit(id: string) {
    const content = drafts[id]?.trim();
    if (!content) return;
    setSubmittingId(id);
    await fetch(`/api/assignments/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setSubmittingId(null);
    load();
  }

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (assignments.length === 0) return <p className="text-sm text-gray-500">No assignments yet.</p>;

  return (
    <div className="space-y-4">
      {assignments.map((a) => {
        const submission = a.submissions[0];
        return (
          <Card key={a.id}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-black">{a.title}</h3>
              <span className="text-xs text-gray-500">{a.subject.name} · Due {new Date(a.dueDate).toLocaleDateString()}</span>
            </div>
            <p className="mb-3 text-sm text-gray-600">{a.instructions}</p>
            {submission ? (
              <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                Submitted {new Date(submission.submittedAt).toLocaleString()}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={3}
                  placeholder="Type your answer…"
                  value={drafts[a.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [a.id]: e.target.value }))}
                  className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm"
                />
                <Button onClick={() => submit(a.id)} loading={submittingId === a.id} className="w-fit">
                  Submit
                </Button>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
