import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getUsers } from "@/lib/admin-users";
import { Button } from "@/components/ui/button";
import { EntityAvatar } from "@/components/ui/entity-avatar";

export default async function UsersPage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_VIEW")) {
    redirect("/dashboard");
  }

  const users = await getUsers();
  const canCreate = hasPermission(session, "USER_CREATE");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Access control
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View users, their roles, and manage simple create/edit actions.
            </p>
          </div>
          {canCreate ? (
            <Link href="/dashboard/users/new">
              <Button>Create user</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      <EntityAvatar src={user.profileImage} name={[user.firstName, user.lastName].filter(Boolean).join(" ")} />
                    </td>
                    <td className="px-4 py-4">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-4">{user.roleName}</td>
                    <td className="px-4 py-4">{user.status}</td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "USER_EDIT") ? (
                        <Link
                          href={`/dashboard/users/${user.id}/edit`}
                          className="text-sm underline underline-offset-4"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={6}>
                    No users found.
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
