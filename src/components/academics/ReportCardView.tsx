"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface Term {
  id: string;
  name: string;
  isCurrent: boolean;
}
interface SubjectRow {
  subjectId: string;
  subjectName: string;
  total: number;
  percentage: number;
  grade: string;
  remark: string;
  classPosition: number | null;
  classSize: number;
  comment: string | null;
}
interface ReportCard {
  student: { firstName: string; lastName: string; admissionNo: string };
  term: { name: string };
  subjects: SubjectRow[];
  overallPercentage: number;
  overallGrade: string | null;
}

async function api<T>(url: string): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function ReportCardView({ studentId }: { studentId: string }) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [termId, setTermId] = useState<string>("");
  const [report, setReport] = useState<ReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(async () => {
      const { ok, data } = await api<{ terms: Term[] }>("/api/school/terms");
      if (ok) {
        const list = (data as { terms: Term[] }).terms;
        setTerms(list);
        const current = list.find((x) => x.isCurrent) ?? list[0];
        if (current) setTermId(current.id);
      }
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!termId) return;
    const t = setTimeout(async () => {
      setError(null);
      const { ok, data } = await api<ReportCard>(`/api/academics/report-card?studentId=${studentId}&termId=${termId}`);
      if (ok) setReport(data as ReportCard);
      else setError((data as { error: string }).error ?? "Could not load report card.");
    }, 0);
    return () => clearTimeout(t);
  }, [termId, studentId]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;
  if (terms.length === 0) return <p className="text-sm text-gray-500">No academic terms have been set up yet.</p>;

  return (
    <div>
      <div className="mb-4">
        <label className="flex max-w-xs flex-col gap-1.5 text-sm font-medium text-black">
          Term
          <select value={termId} onChange={(e) => setTermId(e.target.value)} className="rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
            {terms.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} {t.isCurrent ? "(current)" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}

      {report && (
        <>
          {report.subjects.length === 0 ? (
            <p className="text-sm text-gray-500">No results have been published for this term yet.</p>
          ) : (
            <>
              <Card className="mb-4 overflow-x-auto p-0">
                <table className="w-full text-sm">
                  <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Position</th>
                      <th className="px-4 py-3">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.subjects.map((s) => (
                      <tr key={s.subjectId}>
                        <td className="px-4 py-3 font-medium text-black">{s.subjectName}</td>
                        <td className="px-4 py-3">
                          {s.total} ({s.percentage}%)
                        </td>
                        <td className="px-4 py-3 font-semibold">{s.grade}</td>
                        <td className="px-4 py-3">
                          {s.classPosition ? `${s.classPosition} of ${s.classSize}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{s.comment ?? s.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
              <Card className="inline-flex items-center gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Overall Average</p>
                  <p className="text-xl font-bold text-black">{report.overallPercentage}%</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Overall Grade</p>
                  <p className="text-xl font-bold text-black">{report.overallGrade}</p>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
