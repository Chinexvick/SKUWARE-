"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthCard } from "@/components/layout/AuthCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<"checking" | "success" | "error">(token ? "checking" : "error");
  const [error, setError] = useState<string | null>(token ? null : "This verification link is missing its token.");

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) setStatus("success");
        else {
          setStatus("error");
          setError(data.error ?? "This verification link is invalid or has expired.");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Network error. Please check your connection and try again.");
      });
  }, [token]);

  return (
    <AuthCard>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/brand/logo-horizontal.png" alt="Skuware" width={220} height={39} priority />
        <p className="text-sm text-gray-500">Email verification</p>
      </div>

      <div className="text-center">
        {status === "checking" && <LoadingSpinner size="md" label="Verifying your email…" />}
        {status === "success" && (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Your email has been verified.
          </p>
        )}
        {status === "error" && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
        )}

        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-black underline underline-offset-2">
          Go to sign in
        </Link>
      </div>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-brand-light"><LoadingSpinner size="lg" /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
