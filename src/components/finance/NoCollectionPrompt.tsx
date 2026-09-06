"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Mascot } from "@/components/ui/Mascot";

export function NoCollectionPrompt() {
  const [status, setStatus] = useState<{ hasCollectedToday: boolean; hoursSinceMidnight: number; outstandingCount: number } | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/fees/collection-status")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStatus(d))
      .catch(() => {});
  }, []);

  if (!status || status.hasCollectedToday || status.hoursSinceMidnight < 6 || status.outstandingCount === 0 || dismissed) {
    return null;
  }

  async function sendReminders() {
    setSending(true);
    const res = await fetch("/api/fees/send-reminders-now", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (res.ok) setSent(data.remindersSent ?? 0);
  }

  return (
    <Card className="mb-6 flex flex-col items-center gap-3 border-2 border-brand-yellow text-center sm:flex-row sm:text-left">
      <Mascot pose="error" size={72} />
      <div className="flex-1">
        {sent === null ? (
          <>
            <p className="text-sm font-semibold text-black">No fee collections today.</p>
            <p className="text-sm text-gray-500">
              Should we send a reminder to everyone who currently owes the school? (Dashboard notification now —
              email reminders will send too once an email provider is connected.)
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-black">
            Reminder sent to {sent} account{sent === 1 ? "" : "s"} — check the dashboard notification bell.
          </p>
        )}
      </div>
      {sent === null && (
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => setDismissed(true)}>
            No
          </Button>
          <Button onClick={sendReminders} loading={sending}>
            Yes, send reminder
          </Button>
        </div>
      )}
    </Card>
  );
}
