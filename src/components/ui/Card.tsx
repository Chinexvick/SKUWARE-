import { HTMLAttributes } from "react";

export function Card({
  className = "",
  interactive = false,
  ...props
}: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow ${
        interactive ? "hover:shadow-md" : ""
      } ${className}`}
      {...props}
    />
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent = "neutral",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "neutral" | "positive" | "negative" | "brand";
}) {
  const dotClass = {
    neutral: "bg-gray-300",
    positive: "bg-green-500",
    negative: "bg-red-500",
    brand: "bg-brand-yellow",
  }[accent];

  return (
    <Card className="relative flex flex-col gap-1.5 overflow-hidden">
      <span className={`absolute inset-x-0 top-0 h-1 ${dotClass}`} aria-hidden />
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
      <span className="text-2xl font-bold tracking-tight text-black sm:text-3xl">{value}</span>
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </Card>
  );
}
