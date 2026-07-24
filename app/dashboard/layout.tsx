import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { ensureCsrfCookie } from "@/lib/csrf";
import { CommandPalette } from "@/components/command-palette";

/**
 * Dashboard layout: guards the /dashboard subtree, ensures every
 * authenticated request carries a fresh CSRF token cookie so client-side
 * form submissions can read it, and mounts the global ⌘K command palette.
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

  return (
    <>
      {children}
      <CommandPalette />
    </>
  );
}
