import Link from "next/link";
import { Mascot } from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center gap-4 overflow-hidden bg-brand-light px-4 text-center"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 8%, rgba(250,238,30,0.35), transparent 40%), radial-gradient(circle at 88% 92%, rgba(250,238,30,0.25), transparent 45%)",
      }}
    >
      <Mascot pose="error" size={140} />
      <h1 className="text-2xl font-bold text-black">Page not found</h1>
      <p className="max-w-sm text-sm text-gray-500">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-brand-yellow px-4 py-2.5 text-sm font-semibold text-black transition hover:brightness-95"
      >
        Back to home
      </Link>
    </div>
  );
}
