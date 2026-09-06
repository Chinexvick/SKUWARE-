"use client";

import { useEffect, useState } from "react";
import { Card, StatCard } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

interface Analytics {
  attendance: { rate: number | null; present: number; late: number; absent: number; sampleSize: number };
  finance: { totalDue: number; totalPaid: number; outstanding: number; collectionRate: number | null };
  academics: { classAverages: { classId: string; className: string; average: number; studentCount: number }[]; term: { id: string; name: string } | null };
  enrollment: { trend: { label: string; count: number }[]; total: number };
}

function naira(n: number): string {
  return `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function Bar({ label, value, max, colorClass }: { label: string; value: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-black">{label}</span>
        <span className="text-gray-500">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-light">
        <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AnalyticsClient() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/school")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner size="sm" label="Loading analytics…" className="py-10" />;
  if (!data) return <p className="text-sm text-gray-500">Could not load analytics.</p>;

  const maxEnrollment = Math.max(1, ...data.enrollment.trend.map((m) => m.count));
  const maxClassAvg = 100;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Attendance Rate (30d)" value={data.attendance.rate !== null ? `${data.attendance.rate}%` : "—"} />
        <StatCard label="Fee Collection Rate" value={data.finance.collectionRate !== null ? `${data.finance.collectionRate}%` : "—"} />
        <StatCard label="Outstanding Fees" value={naira(data.finance.outstanding)} />
        <StatCard label="Total Students" value={data.enrollment.total} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Attendance breakdown (last 30 days)
          </h2>
          {data.attendance.sampleSize === 0 ? (
            <p className="text-sm text-gray-500">No attendance recorded in the last 30 days.</p>
          ) : (
            <div className="space-y-3">
              <Bar label="Present" value={data.attendance.present} max={data.attendance.sampleSize} colorClass="bg-green-500" />
              <Bar label="Late" value={data.attendance.late} max={data.attendance.sampleSize} colorClass="bg-amber-500" />
              <Bar label="Absent" value={data.attendance.absent} max={data.attendance.sampleSize} colorClass="bg-red-500" />
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Enrollment trend (last 6 months)
          </h2>
          <div className="flex h-40 items-end justify-between gap-2">
            {data.enrollment.trend.map((m) => (
              <div key={m.label} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-brand-yellow"
                  style={{ height: `${Math.max(4, (m.count / maxEnrollment) * 100)}%` }}
                />
                <span className="text-xs text-gray-500">{m.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-500">Class performance</h2>
          {data.academics.term && <p className="mb-4 text-xs text-gray-500">Term: {data.academics.term.name}</p>}
          {data.academics.classAverages.length === 0 ? (
            <p className="text-sm text-gray-500">No scores recorded yet for the current term.</p>
          ) : (
            <div className="space-y-3">
              {data.academics.classAverages
                .sort((a, b) => b.average - a.average)
                .map((c) => (
                  <Bar
                    key={c.classId}
                    label={`${c.className} (${c.studentCount} students)`}
                    value={c.average}
                    max={maxClassAvg}
                    colorClass={c.average >= 50 ? "bg-black" : "bg-red-500"}
                  />
                ))}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Finance summary</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">Total invoiced</p>
              <p className="text-lg font-bold text-black">{naira(data.finance.totalDue)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total collected</p>
              <p className="text-lg font-bold text-green-700">{naira(data.finance.totalPaid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Outstanding</p>
              <p className="text-lg font-bold text-red-700">{naira(data.finance.outstanding)}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
