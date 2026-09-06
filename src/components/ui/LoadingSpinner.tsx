import Image from "next/image";

const SIZE_PX: Record<"sm" | "md" | "lg", number> = { sm: 32, md: 48, lg: 72 };

/** Brand loading indicator: the Skuware icon with a light ring spinning around it. */
export function LoadingSpinner({
  size = "md",
  label,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}) {
  const px = SIZE_PX[size];
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: px * 1.6, height: px * 1.6 }}>
        <span
          className="absolute inset-0 animate-spin rounded-full border-[3px] border-brand-light border-t-brand-yellow"
          aria-hidden
        />
        <Image
          src="/brand/logo-icon.png"
          alt="Skuware"
          width={px}
          height={px}
          className="rounded-md"
          priority
        />
      </div>
      {label && <p className="text-sm font-medium text-gray-500">{label}</p>}
    </div>
  );
}

/** Full-viewport variant for page/route-level loading states. */
export function FullPageSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-light">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}
