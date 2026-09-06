"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "./NotificationBell";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

function NavIcon({ label }: { label: string }) {
  // A small set of recognizable glyphs keyed by common nav labels — keeps
  // every sidebar readable at a glance without needing per-role icon lists.
  const common = "h-[18px] w-[18px] shrink-0";
  if (/overview|scan/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    );
  }
  if (/student/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 2 8l10 5 10-5-10-5Z" />
        <path d="M6 10.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-5.5" />
      </svg>
    );
  }
  if (/staff|teacher|bursar|principal/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      </svg>
    );
  }
  if (/parent/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="8.5" cy="8" r="2.6" />
        <circle cx="16" cy="9" r="2.2" />
        <path d="M3 20c0-2.9 2.5-5 5.5-5s5.5 2.1 5.5 5" />
        <path d="M14 19.5c.3-2.4 2.1-4 4.3-4 2.3 0 4.2 1.8 4.2 4.5" />
      </svg>
    );
  }
  if (/academic|grading|result/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4 3 8l9 4 9-4-9-4Z" />
        <path d="M6.5 10.3v4.4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.4" />
        <path d="M21 8v6" />
      </svg>
    );
  }
  if (/finance|fee|payment|invoice/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2.5" y="6" width="19" height="13" rx="2" />
        <path d="M2.5 10h19" />
        <path d="M6 14.5h4" />
      </svg>
    );
  }
  if (/admission/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 4v10m0 0-3.5-3.5M12 14l3.5-3.5" />
        <path d="M4 15v3.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V15" />
      </svg>
    );
  }
  if (/document/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 3h7l4 4v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M14 3v4h4" />
        <path d="M9 12.5h6M9 16h6" />
      </svg>
    );
  }
  if (/gate/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M9 4v16M15 4v16M3 10h18M3 15h18" />
      </svg>
    );
  }
  if (/communication|message/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h16v11H8l-4 4V5Z" />
      </svg>
    );
  }
  if (/attendance|timetable/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3.5" y="5" width="17" height="15" rx="2" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </svg>
    );
  }
  if (/assignment/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 3h8v3H8z" />
        <rect x="5" y="6" width="14" height="15" rx="1.5" />
        <path d="M9 12.5h6M9 16h6" />
      </svg>
    );
  }
  if (/ai/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        <circle cx="12" cy="12" r="3.4" />
      </svg>
    );
  }
  if (/exam/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M20.5 20.5 16 16" />
      </svg>
    );
  }
  if (/school|billing/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
      </svg>
    );
  }
  if (/user/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      </svg>
    );
  }
  if (/audit/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M20.5 20.5 16 16M8 11h6" />
      </svg>
    );
  }
  if (/question|review/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9.1 9a2.9 2.9 0 1 1 3.8 2.8c-.9.3-1.4 1-1.4 1.9v.3" />
        <circle cx="12" cy="17.5" r="0.9" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  if (/universit/i.test(label)) {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m3 8 9-5 9 5-9 5-9-5Z" />
        <path d="M7 11v5c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-5" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
    </svg>
  );
}

function SidebarNav({
  navItems,
  pathname,
  onNavigate,
}: {
  navItems: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active
                ? "bg-brand-yellow text-black shadow-sm"
                : "text-gray-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <NavIcon label={item.label} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
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
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-brand-light">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-black text-white md:flex">
        <div className="flex items-center gap-2 px-5 py-6">
          <Image src="/brand/logo-icon.png" alt="Skuware" width={32} height={32} className="rounded-md" />
          <span className="text-lg font-bold tracking-tight">SKUWARE</span>
        </div>
        <SidebarNav navItems={navItems} pathname={pathname} />
        <div className="border-t border-white/10 px-5 py-4 text-xs text-gray-400">{roleLabel}</div>
      </aside>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-black text-white shadow-2xl">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2">
                <Image src="/brand/logo-icon.png" alt="Skuware" width={30} height={30} className="rounded-md" />
                <span className="text-lg font-bold tracking-tight">SKUWARE</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-gray-300 hover:bg-white/10 hover:text-white"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <SidebarNav navItems={navItems} pathname={pathname} onNavigate={() => setMenuOpen(false)} />
            <div className="border-t border-white/10 px-5 py-4 text-xs text-gray-400">{roleLabel}</div>
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className="-ml-1 rounded-md p-1.5 text-black hover:bg-brand-light md:hidden"
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-bold text-black">{title}</h1>
              <p className="text-xs text-gray-500">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
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
