import Link from "next/link";
import { redirect } from "next/navigation";
import { getRoles } from "@/lib/admin-roles";
import { getSession, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function RolesPage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_VIEW")) {
    redirect("/dashboard");
  }

  const roles = await getRoles();
  const canCreate = hasPermission(session, "ROLE_CREATE");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Access control
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Roles</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View roles, their permission counts, and manage create/edit actions.
            </p>
          </div>
          {canCreate ? (
            <Link href="/dashboard/roles/new">
              <Button>Create role</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Permissions</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length ? (
                roles.map((role) => (
                  <tr key={role.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">{role.name}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {role.description || "—"}
                    </td>
                    <td className="px-4 py-4">{role.permissionCount}</td>
                    <td className="px-4 py-4">
                      {role.isSystem ? "System" : "Custom"}
                    </td>
                    <td className="px-4 py-4">
                      {role.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "ROLE_EDIT") ? (
                        <Link
                          href={`/dashboard/roles/${role.id}/edit`}
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
                    No roles found.
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
