import { redirect } from "next/navigation";
import { RoleForm } from "@/components/roles/role-form";
import { getPermissionOptions } from "@/lib/admin-permissions";
import { getSession, hasPermission } from "@/lib/auth";

export default async function NewRolePage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_CREATE")) {
    redirect("/dashboard/roles");
  }

  const permissions = await getPermissionOptions();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <RoleForm mode="create" actionUrl="/api/roles" permissions={permissions} />
        </div>
      </div>
    </main>
  );
}
