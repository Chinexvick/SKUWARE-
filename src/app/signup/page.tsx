"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthCard } from "@/components/layout/AuthCard";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    schoolName: "",
    ownerFirstName: "",
    ownerLastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName: form.schoolName,
          ownerFirstName: form.ownerFirstName,
          ownerLastName: form.ownerLastName,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard maxWidth="max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Image src="/brand/logo-horizontal.png" alt="Skuware" width={220} height={39} priority />
          <p className="text-sm text-gray-500">Register your school on Skuware.</p>
        </div>

        {success ? (
          <p className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            School created successfully. Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <Input
              label="School name"
              name="schoolName"
              required
              value={form.schoolName}
              onChange={(e) => update("schoolName", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Your first name"
                name="ownerFirstName"
                required
                value={form.ownerFirstName}
                onChange={(e) => update("ownerFirstName", e.target.value)}
              />
              <Input
                label="Your last name"
                name="ownerLastName"
                required
                value={form.ownerLastName}
                onChange={(e) => update("ownerLastName", e.target.value)}
              />
            </div>
            <Input
              label="Email address"
              type="email"
              name="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
            />
            <Input
              label="Phone number (optional)"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                name="password"
                autoComplete="new-password"
                required
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
              />
              <Input
                label="Confirm password"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500">
              Use at least 10 characters, with uppercase, lowercase and a number.
            </p>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create school account
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-black underline underline-offset-2">
            Sign in
          </Link>
        </p>
    </AuthCard>
  );
}
