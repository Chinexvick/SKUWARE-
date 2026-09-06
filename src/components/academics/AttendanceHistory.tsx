"use client";

import { useEffect, useState } from "react";
import { Card, StatCard } from "@/components/ui/Card";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-700",
  LATE: "bg-yellow-100 text-yellow-800",
  EXCUSED: "bg-gray-100 text-gray-700",
};

export function AttendanceHistory({ studentId }: { studentId: string }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/attendance?studentId=${studentId}`);
      const data = await res.json();
      if (res.ok) setRecords(data.records);
      setLoading(false);
    }, 0);
    return () => clearTimeout(t);
  }, [studentId]);

  if (loading) return <p className="text-sm text-gray-500">Loading…</p>;

  const total = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <div>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Attendance Rate" value={`${rate}%`} />
        <StatCard label="Present" value={records.filter((r) => r.status === "PRESENT").length} />
        <StatCard label="Absent" value={records.filter((r) => r.status === "ABSENT").length} />
        <StatCard label="Late" value={records.filter((r) => r.status === "LATE").length} />
      </div>

      {records.length === 0 ? (
        <p className="text-sm text-gray-500">No attendance has been recorded yet.</p>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">{new Date(r.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
