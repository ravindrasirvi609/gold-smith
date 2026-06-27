import { notFound, redirect } from "next/navigation";
import { PermissionForm } from "@/components/permissions/permission-form";
import { getPermissionById } from "@/lib/admin-permissions";
import { getSession, hasPermission } from "@/lib/auth";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPermissionPage({ params }: PageProps) {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_EDIT")) {
    redirect("/dashboard/permissions");
  }

  const { id } = await params;
  const permission = await getPermissionById(id);

  if (!permission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <PermissionForm
            mode="edit"
            actionUrl={`/api/permissions/${id}`}
            canDelete={hasPermission(session, "PERMISSION_DELETE")}
            initialValues={permission}
          />
        </div>
      </div>
    </main>
  );
}
