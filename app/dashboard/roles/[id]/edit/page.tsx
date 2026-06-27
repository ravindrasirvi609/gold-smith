import { notFound, redirect } from "next/navigation";
import { RoleForm } from "@/components/roles/role-form";
import { getPermissionOptions } from "@/lib/admin-permissions";
import { getRoleById } from "@/lib/admin-roles";
import { getSession, hasPermission } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRolePage({ params }: PageProps) {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_EDIT")) {
    redirect("/dashboard/roles");
  }

  const { id } = await params;
  const [role, permissions] = await Promise.all([getRoleById(id), getPermissionOptions()]);

  if (!role) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <RoleForm
            mode="edit"
            actionUrl={`/api/roles/${id}`}
            permissions={permissions}
            canDelete={hasPermission(session, "ROLE_DELETE")}
            initialValues={role}
          />
        </div>
      </div>
    </main>
  );
}
