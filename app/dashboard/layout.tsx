import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureCsrfCookie } from "@/lib/csrf";

/**
 * Dashboard layout: guards the /dashboard subtree and ensures every
 * authenticated request carries a fresh CSRF token cookie so client-side
 * form submissions can read it and echo it back via the x-csrf-token
 * header.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await ensureCsrfCookie();

  return <>{children}</>;
}
