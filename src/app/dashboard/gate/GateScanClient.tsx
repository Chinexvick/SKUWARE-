"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface VerifyResult {
  result: "GRANTED" | "DENIED_FEES" | "DENIED_STATUS" | "DENIED_UNKNOWN";
  message?: string;
  student?: { firstName: string; lastName: string; admissionNo: string; class: string | null; arm: string | null };
}

const RESULT_STYLE: Record<string, string> = {
  GRANTED: "border-green-500 bg-green-50 text-green-800",
  DENIED_FEES: "border-red-500 bg-red-50 text-red-800",
  DENIED_STATUS: "border-red-500 bg-red-50 text-red-800",
  DENIED_UNKNOWN: "border-gray-400 bg-gray-50 text-gray-700",
};

export function GateScanClient() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function verify(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/gate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setResult(data);
    setCode("");
    setLoading(false);
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <h2 className="text-sm font-semibold text-gray-500">Verify Student</h2>
      <form onSubmit={verify} className="my-6 flex flex-col gap-3">
        <Input label="PIN or QR code" placeholder="Enter or scan…" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />
        <Button type="submit" loading={loading} disabled={!code}>
          Verify
        </Button>
      </form>

      {result && (
        <div className={`rounded-xl border-2 p-4 text-left ${RESULT_STYLE[result.result]}`}>
          <p className="text-lg font-bold">{result.result.replace("_", " ")}</p>
          {result.student ? (
            <div className="mt-2 text-sm">
              <p className="font-semibold">
                {result.student.firstName} {result.student.lastName}
              </p>
              <p>Admission No: {result.student.admissionNo}</p>
              {result.student.class && (
                <p>
                  Class: {result.student.class} {result.student.arm ?? ""}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm">{result.message}</p>
          )}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-500">
        A camera-based QR scanner can be wired in later; manual code entry works today via keyboard-wedge barcode
        scanners too.
      </p>
    </Card>
  );
}
