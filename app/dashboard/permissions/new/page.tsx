import { redirect } from "next/navigation";
import { PermissionForm } from "@/components/permissions/permission-form";
import { getSession, hasPermission } from "@/lib/auth";

export default async function NewPermissionPage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_CREATE")) {
    redirect("/dashboard/permissions");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <PermissionForm mode="create" actionUrl="/api/permissions" />
        </div>
      </div>
    </main>
  );
}
