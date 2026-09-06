"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascot } from "@/components/ui/Mascot";

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
const SECONDS_PER_QUESTION = 90;
const STORAGE_KEY = "skuware:exam-prep:session";

type Stage = "setup" | "loading" | "quiz" | "submitted";

interface SavedSession {
  examName: (typeof EXAMS)[number];
  subject: string;
  questions: Question[];
  answers: Record<string, string>;
  marked: string[];
  deadline: number; // epoch ms
}

function loadSaved(): SavedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedSession;
    if (!parsed.questions?.length || parsed.deadline < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveSession(session: SavedSession | null) {
  try {
    if (!session) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // localStorage unavailable — the quiz still works, it just won't survive a refresh.
  }
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamPrepClient() {
  // Restore an in-progress session up front (survives refresh/network drop)
  // via lazy initializers, rather than setting state from inside an effect.
  const [restored] = useState(() => loadSaved());
  const [stage, setStage] = useState<Stage>(restored ? "quiz" : "setup");
  const [examName, setExamName] = useState<(typeof EXAMS)[number]>(restored?.examName ?? "JAMB");
  const [subject, setSubject] = useState(restored?.subject ?? "Mathematics");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [count, setCount] = useState(10);
  const [questions, setQuestions] = useState<Question[]>(restored?.questions ?? []);
  const [answers, setAnswers] = useState<Record<string, string>>(restored?.answers ?? {});
  const [marked, setMarked] = useState<Set<string>>(new Set(restored?.marked ?? []));
  const [current, setCurrent] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(restored?.deadline ?? null);
  const [remaining, setRemaining] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef(false);

  // Persist on every change while a quiz is active.
  useEffect(() => {
    if (stage !== "quiz" || deadline === null) return;
    saveSession({ examName, subject, questions, answers, marked: Array.from(marked), deadline });
  }, [stage, examName, subject, questions, answers, marked, deadline]);

  // Countdown timer, auto-submits at zero.
  useEffect(() => {
    if (stage !== "quiz" || deadline === null) return;
    const tick = () => setRemaining(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [stage, deadline]);

  useEffect(() => {
    if (stage === "quiz" && deadline !== null && remaining === 0 && !submittedRef.current) {
      submittedRef.current = true;
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, stage, deadline]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

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
    submittedRef.current = false;
    setQuestions(data.questions);
    setAnswers({});
    setMarked(new Set());
    setCurrent(0);
    setDeadline(Date.now() + data.questions.length * SECONDS_PER_QUESTION * 1000);
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
    saveSession(null);
    if (res.ok) {
      setResult(data);
      setStage("submitted");
    }
  }

  function toggleMark(id: string) {
    setMarked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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
            {" "}Timed CBT: {SECONDS_PER_QUESTION}s per question.
          </p>
        </div>
      </Card>
    );
  }

  if (stage === "quiz") {
    const q = questions[current];
    return (
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
        <div className="space-y-4">
          <Card className="flex items-center justify-between">
            <span className="text-sm font-semibold text-black">
              Question {current + 1} of {questions.length}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                remaining <= 30 ? "bg-red-100 text-red-700" : "bg-brand-light text-black"
              }`}
            >
              {formatClock(remaining)}
            </span>
          </Card>

          <Card>
            <p className="mb-4 text-base font-semibold text-black">{q.prompt}</p>
            <div className="space-y-2">
              {q.options.map((opt) => (
                <label
                  key={opt}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                    answers[q.id] === opt ? "border-brand-yellow bg-brand-yellow/20" : "border-gray-200 hover:bg-brand-light"
                  }`}
                >
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="secondary" onClick={() => toggleMark(q.id)}>
                {marked.has(q.id) ? "Unmark" : "Mark for review"}
              </Button>
              <Button
                variant="secondary"
                disabled={current === 0}
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              >
                Previous
              </Button>
              {current < questions.length - 1 ? (
                <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Next</Button>
              ) : (
                <Button onClick={submit}>Submit test</Button>
              )}
            </div>
          </Card>
        </div>

        <Card className="h-fit">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {answeredCount}/{questions.length} answered
          </p>
          <div className="grid grid-cols-5 gap-1.5 lg:grid-cols-4">
            {questions.map((qq, i) => {
              const isAnswered = !!answers[qq.id];
              const isMarked = marked.has(qq.id);
              const isCurrent = i === current;
              return (
                <button
                  key={qq.id}
                  onClick={() => setCurrent(i)}
                  className={`flex h-8 w-8 items-center justify-center rounded-md border text-xs font-semibold transition ${
                    isCurrent
                      ? "border-black bg-black text-white"
                      : isMarked
                        ? "border-amber-400 bg-amber-100 text-amber-800"
                        : isAnswered
                          ? "border-green-400 bg-green-100 text-green-800"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-brand-light"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <Button className="mt-4 w-full" onClick={submit}>
            Submit test
          </Button>
        </Card>
      </div>
    );
  }

  if (stage === "submitted" && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="text-center">
          <Mascot pose={result.score / result.totalQuestions >= 0.5 ? "celebrate" : "error"} size={90} className="mx-auto" />
          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Score</p>
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
        <Button
          onClick={() => {
            setStage("setup");
            setResult(null);
          }}
        >
          Start another practice test
        </Button>
      </div>
    );
  }

  return null;
}
