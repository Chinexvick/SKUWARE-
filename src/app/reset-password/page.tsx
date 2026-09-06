"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/layout/AuthCard";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard>
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Image src="/brand/logo-horizontal.png" alt="Skuware" width={220} height={39} priority />
        <p className="text-sm text-gray-500">Choose a new password.</p>
      </div>

      {!token ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
          This reset link is missing its token. Please use the link from your password reset email.
        </p>
      ) : success ? (
        <p className="rounded-lg bg-green-50 px-4 py-3 text-center text-sm font-medium text-green-700">
          Password reset. Redirecting you to sign in…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="New password"
            type="password"
            name="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Confirm new password"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <p className="text-xs text-gray-500">Use at least 10 characters, with uppercase, lowercase and a number.</p>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="font-semibold text-black underline underline-offset-2">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-brand-light"><LoadingSpinner size="lg" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
