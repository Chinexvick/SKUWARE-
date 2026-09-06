"use client";

import { useState } from "react";
import { Button } from "./Button";

/** Downloads a CSV from an API route that returns Content-Disposition: attachment. */
export function ExportCsvButton({ href, label = "Export CSV" }: { href: string; label?: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleClick() {
    setDownloading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) return;
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "export.csv";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Button variant="secondary" onClick={handleClick} loading={downloading} className="w-full sm:w-auto">
      {label}
    </Button>
  );
}
