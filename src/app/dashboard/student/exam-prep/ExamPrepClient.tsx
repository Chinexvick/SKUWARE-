"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface Question {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}
interface AttemptResult {
  score: number;
  totalQuestions: number;
  results: { questionId: string; correct: boolean; correctAnswer: string; explanation: string }[];
}

const EXAMS = ["JAMB", "WAEC", "NECO", "POST_UTME"] as const;

type Stage = "setup" | "loading" | "quiz" | "submitted";

export function ExamPrepClient() {
  const [stage, setStage] = useState<Stage>("setup");
  const [examName, setExamName] = useState<(typeof EXAMS)[number]>("JAMB");
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setStage("loading");
    setError(null);
    const res = await fetch("/api/ai/question-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ examName, subject, topic: topic || undefined, difficulty, count }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not generate a practice test.");
      setStage("setup");
      return;
    }
    setQuestions(data.questions);
    setAnswers({});
    setStage("quiz");
  }

  async function submit() {
    const res = await fetch("/api/exam-prep/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        examName,
        subject,
        answers: questions.map((q) => ({ questionId: q.id, chosenAnswer: answers[q.id] ?? null })),
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setResult(data);
      setStage("submitted");
    }
  }

  if (stage === "setup" || stage === "loading") {
    return (
      <Card className="mx-auto max-w-lg">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Build a Practice Test</h2>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Exam
            <select value={examName} onChange={(e) => setExamName(e.target.value as typeof examName)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              {EXAMS.map((e) => (
                <option key={e} value={e}>
                  {e.replace("_", "-")}
                </option>
              ))}
            </select>
          </label>
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <Input label="Topic (optional)" placeholder="e.g. Algebra" value={topic} onChange={(e) => setTopic(e.target.value)} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
          <Input label="Number of questions" type="number" min={1} max={40} value={count} onChange={(e) => setCount(Number(e.target.value))} />
          <Button onClick={generate} loading={stage === "loading"}>
            Generate practice test
          </Button>
          <p className="text-xs text-gray-500">
            Questions are AI-generated in the style of the selected exam — not official past questions.
          </p>
        </div>
      </Card>
    );
  }

  if (stage === "quiz") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <p className="mb-3 text-sm font-semibold text-black">
              {i + 1}. {q.prompt}
            </p>
            <div className="space-y-1.5">
              {q.options.map((opt) => (
                <label key={opt} className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-brand-light">
                  <input
                    type="radio"
                    name={q.id}
                    checked={answers[q.id] === opt}
                    onChange={() => setAnswers((a) => ({ ...a, [q.id]: opt }))}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </Card>
        ))}
        <Button onClick={submit}>Submit test</Button>
      </div>
    );
  }

  if (stage === "submitted" && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Score</p>
          <p className="text-3xl font-bold text-black">
            {result.score} / {result.totalQuestions}
          </p>
        </Card>
        {questions.map((q, i) => {
          const r = result.results.find((x) => x.questionId === q.id)!;
          return (
            <Card key={q.id} className={r.correct ? "border-green-300" : "border-red-300"}>
              <p className="mb-1 text-sm font-semibold text-black">
                {i + 1}. {q.prompt}
              </p>
              <p className="text-sm">
                Your answer: <span className={r.correct ? "text-green-700" : "text-red-700"}>{answers[q.id] ?? "—"}</span>
              </p>
              {!r.correct && <p className="text-sm text-green-700">Correct answer: {r.correctAnswer}</p>}
              <p className="mt-1 text-xs text-gray-500">{r.explanation}</p>
            </Card>
          );
        })}
        <Button onClick={() => setStage("setup")}>Start another practice test</Button>
      </div>
    );
  }

  return null;
}
