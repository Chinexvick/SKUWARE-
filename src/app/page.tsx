import { redirect } from "next/navigation";

// No public landing page yet — it will be built and wired in separately.
// Root simply routes into the auth flow for now.
export default function RootPage() {
  redirect("/login");
}
