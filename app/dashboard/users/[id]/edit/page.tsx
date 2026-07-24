import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import { getSession, hasPermission, listUserSessions } from "@/lib/auth";
import { getRoleOptions, getUserById } from "@/lib/admin-users";
import { RowActionButton } from "@/components/ui/row-action-button";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: PageProps) {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_EDIT")) {
    redirect("/dashboard/users");
  }

  const { id } = await params;
  const [user, roles, sessions] = await Promise.all([
    getUserById(id),
    getRoleOptions(),
    listUserSessions(id),
  ]);

  if (!user) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center px-6 py-10">
        <div className="w-full space-y-6">
          <UserForm
            mode="edit"
            actionUrl={`/api/users/${id}`}
            roles={roles}
            initialValues={{
              ...user,
              profileImage: user.profileImage ?? undefined,
            }}
          />

          <div className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Live sessions</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {sessions.length === 0
                    ? "This user has no live sessions."
                    : `${sessions.length} active session${sessions.length === 1 ? "" : "s"}. Force-logout invalidates every session so the user must sign in again.`}
                </p>
              </div>
              {sessions.length > 0 ? (
                <RowActionButton
                  url={`/api/users/${id}/force-logout`}
                  method="POST"
                  tone="warning"
                  confirmTitle="Force logout all sessions?"
                  confirmDescription="Every device this user is signed in on will need to sign in again on its next request. Use this if you suspect an account has been compromised."
                  successMessage="All sessions revoked."
                >
                  Force logout
                </RowActionButton>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
