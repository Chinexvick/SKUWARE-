import { Mascot } from "./Mascot";

export function EmptyState({
  pose = "empty",
  title,
  description,
  className = "",
  children,
}: {
  pose?: "wave" | "empty" | "celebrate" | "sleep" | "error";
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-10 text-center ${className}`}>
      <Mascot pose={pose} size={100} />
      <p className="text-sm font-semibold text-black">{title}</p>
      {description && <p className="max-w-xs text-sm text-gray-500">{description}</p>}
      {children}
    </div>
  );
}
