"use client";

import { useEffect, useState } from "react";

function timeGreeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Time-of-day greeting using the viewer's own clock. Starts as "Welcome" (the
 * same text the server renders) and swaps to the real greeting after mount —
 * reading the clock during render/SSR would use the server's timezone, not
 * the viewer's, and could mismatch on hydration.
 */
export function Greeting({ firstName }: { firstName: string }) {
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the viewer's local clock after mount
    setGreeting(timeGreeting(new Date().getHours()));
  }, []);

  return (
    <h2 className="text-xl font-bold text-black sm:text-2xl">
      {greeting}, {firstName} <span aria-hidden>👋</span>
    </h2>
  );
}
