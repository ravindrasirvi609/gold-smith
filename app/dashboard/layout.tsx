import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { CommandPalette } from "@/components/command-palette";
import { CsrfCookieBootstrap } from "@/components/csrf-cookie-bootstrap";

/**
 * Dashboard layout: guards the /dashboard subtree and mounts the client-side
 * CSRF bootstrap plus the global ⌘K command palette.
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

  return (
    <>
      {children}
      <CsrfCookieBootstrap />
      <CommandPalette />
    </>
  );
}
