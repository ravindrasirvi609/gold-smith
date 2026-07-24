import { redirect } from "next/navigation";
import { getSession, listUserSessions } from "@/lib/auth";
import { RowActionButton } from "@/components/ui/row-action-button";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

function fmt(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

/**
 * User-facing session management. Lists every live session for the
 * logged-in user and lets them revoke any of them (e.g. after signing in
 * on a shared device by mistake).
 */
export default async function MySessionsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const sessions = await listUserSessions(session.userId);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Account" },
            { label: "Sessions" },
          ]}
          className="mb-4"
        />
        <h1 className="text-3xl font-semibold tracking-tight">Active sessions</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You are signed in to Gold Smith on the devices listed below. Revoke
          any session you don&apos;t recognise.
        </p>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Signed in</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length ? (
                sessions.map((row) => (
                  <tr key={row.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">{fmt(row.createdAt)}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {fmt(row.expiresAt)}
                    </td>
                    <td className="px-4 py-4">
                      <RowActionButton
                        url={`/api/sessions/${row.id}`}
                        method="DELETE"
                        tone="danger"
                        confirmTitle="Revoke this session?"
                        confirmDescription="Any device holding this session will be signed out on its next request."
                        successMessage="Session revoked."
                      >
                        Revoke
                      </RowActionButton>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-10 text-center text-muted-foreground" colSpan={3}>
                    No active sessions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
