"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface Question {
  id: string;
  examName: string;
  subject: string;
  difficulty: string;
  promptText: string;
  source: string;
  reviewStatus: string;
}

export function QuestionsClient({ defaultStatus }: { defaultStatus?: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [status, setStatus] = useState(defaultStatus ?? "");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/content/questions${status ? `?status=${status}` : ""}`);
    const data = await res.json();
    if (res.ok) setQuestions(data.questions);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function review(id: string, reviewStatus: string) {
    await fetch(`/api/content/questions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewStatus }),
    });
    load();
  }

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {["", "DRAFT", "APPROVED", "FLAGGED"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${status === s ? "bg-brand-yellow text-black" : "bg-brand-light text-gray-500"}`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : questions.length === 0 ? (
        <p className="text-sm text-gray-500">No questions found.</p>
      ) : (
        <div className="space-y-3">
          {questions.map((q) => (
            <Card key={q.id}>
              <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  {q.examName} · {q.subject} · {q.difficulty} · {q.source}
                </span>
                <span className="rounded-full bg-brand-light px-2 py-0.5 font-semibold">{q.reviewStatus}</span>
              </div>
              <p className="mb-3 text-sm text-black">{q.promptText}</p>
              <div className="flex gap-2">
                <button onClick={() => review(q.id, "APPROVED")} className="rounded-lg bg-brand-yellow px-3 py-1 text-xs font-bold text-black">
                  Approve
                </button>
                <button onClick={() => review(q.id, "FLAGGED")} className="rounded-lg border border-black px-3 py-1 text-xs font-semibold text-black">
                  Flag
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
