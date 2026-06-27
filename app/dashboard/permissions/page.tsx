import Link from "next/link";
import { redirect } from "next/navigation";
import { getPermissions } from "@/lib/admin-permissions";
import { getSession, hasPermission } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default async function PermissionsPage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_VIEW")) {
    redirect("/dashboard");
  }

  const permissions = await getPermissions();
  const canCreate = hasPermission(session, "PERMISSION_CREATE");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Access control
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">Permissions</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              View permission codes and manage create/edit actions.
            </p>
          </div>
          {canCreate ? (
            <Link href="/dashboard/permissions/new">
              <Button>Create permission</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Module</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {permissions.length ? (
                permissions.map((permission) => (
                  <tr key={permission.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">{permission.module}</td>
                    <td className="px-4 py-4">{permission.action}</td>
                    <td className="px-4 py-4 font-mono text-xs">{permission.code}</td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {permission.description || "—"}
                    </td>
                    <td className="px-4 py-4">
                      {permission.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "PERMISSION_EDIT") ? (
                        <Link
                          href={`/dashboard/permissions/${permission.id}/edit`}
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
                    No permissions found.
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
