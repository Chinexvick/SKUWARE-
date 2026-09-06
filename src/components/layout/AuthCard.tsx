export function AuthCard({ children, maxWidth = "max-w-md" }: { children: React.ReactNode; maxWidth?: string }) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-light px-4 py-10"
      style={{
        backgroundImage:
          "radial-gradient(circle at 12% 8%, rgba(250,238,30,0.35), transparent 40%), radial-gradient(circle at 88% 92%, rgba(250,238,30,0.25), transparent 45%)",
      }}
    >
      <div className={`relative w-full ${maxWidth} animate-fade-in rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-black/5`}>
        {children}
      </div>
    </div>
  );
}
