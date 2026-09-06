"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/layout/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSent(true);
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
        <p className="text-sm text-gray-500">Reset your password.</p>
      </div>

      {sent ? (
        <div className="text-center">
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            If that email is registered, a reset link has been sent. Since email delivery isn&apos;t wired up
            for this school yet, ask your school administrator for the link if it doesn&apos;t arrive.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-black underline underline-offset-2">
            Back to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <Input
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Send reset link
          </Button>

          <Link href="/login" className="text-center text-sm font-medium text-black underline underline-offset-2">
            Back to sign in
          </Link>
        </form>
      )}
    </AuthCard>
  );
}
