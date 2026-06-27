import { redirect } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getRoleOptions } from "@/lib/admin-users";

export default async function NewUserPage() {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_CREATE")) {
    redirect("/dashboard/users");
  }

  const roles = await getRoleOptions();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <UserForm mode="create" actionUrl="/api/users" roles={roles} />
        </div>
      </div>
    </main>
  );
}
