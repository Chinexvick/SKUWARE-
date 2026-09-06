"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  admissionNo: string;
}
interface Credential {
  id: string;
  pin: string;
  status: string;
  student: Student;
}

async function api<T>(url: string, init?: RequestInit): Promise<{ ok: boolean; data: T | { error: string } }> {
  const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function GateAccessClient() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [issuedQr, setIssuedQr] = useState<{ studentId: string; dataUrl: string; pin: string } | null>(null);
  const [issuing, setIssuing] = useState(false);

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([
      api<{ credentials: Credential[] }>("/api/gate/credentials"),
      api<{ students: Student[] }>("/api/people/students"),
    ]);
    if (c.ok) setCredentials((c.data as { credentials: Credential[] }).credentials);
    if (s.ok) setStudents((s.data as { students: Student[] }).students);
    setLoading(false);
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, []);

  async function issue() {
    if (!studentId) return;
    setIssuing(true);
    setError(null);
    const { ok, data } = await api<{ qrDataUrl: string; credential: Credential }>("/api/gate/credentials", {
      method: "POST",
      body: JSON.stringify({ studentId }),
    });
    if (!ok) setError((data as { error: string }).error ?? "Could not issue credential.");
    else {
      const d = data as { qrDataUrl: string; credential: Credential };
      setIssuedQr({ studentId, dataUrl: d.qrDataUrl, pin: d.credential.pin });
      load();
    }
    setIssuing(false);
  }

  return (
    <div>
      <Card className="mb-6">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Issue / Reissue Credential</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-black">
            Student
            <select value={studentId} onChange={(e) => setStudentId(e.target.value)} className="min-w-64 rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm">
              <option value="">Select…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.admissionNo} — {s.lastName} {s.firstName}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={issue} loading={issuing} disabled={!studentId}>
            Issue credential
          </Button>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
        {issuedQr && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border-2 border-brand-yellow p-4">
            <Image src={issuedQr.dataUrl} alt="QR code" width={120} height={120} unoptimized />
            <div>
              <p className="text-sm font-semibold text-black">PIN: {issuedQr.pin}</p>
              <p className="text-xs text-gray-500">Print or share this QR/PIN with the student.</p>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-brand-light text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">PIN</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">Loading…</td>
              </tr>
            ) : credentials.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">No credentials issued yet.</td>
              </tr>
            ) : (
              credentials.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium text-black">
                    {c.student.lastName} {c.student.firstName} ({c.student.admissionNo})
                  </td>
                  <td className="px-4 py-3 font-mono">{c.pin}</td>
                  <td className="px-4 py-3">{c.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
