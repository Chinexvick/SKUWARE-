"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function DashboardShell({
  title,
  roleLabel,
  userName,
  navItems,
  children,
}: {
  title: string;
  roleLabel: string;
  userName: string;
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-brand-light">
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-black text-white md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <Image src="/brand/logo-icon.png" alt="Skuware" width={32} height={32} className="rounded-md" />
          <span className="text-lg font-bold">SKUWARE</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 px-5 py-4 text-xs text-gray-400">
          {roleLabel}
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-8">
          <div>
            <h1 className="text-lg font-bold text-black">{title}</h1>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-black sm:inline">{userName}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-black">
              {userName.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-lg border border-black px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-black hover:text-white disabled:opacity-50"
            >
              {loggingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
