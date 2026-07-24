import { notFound, redirect } from "next/navigation";
import { UserForm } from "@/components/users/user-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getRoleOptions, getUserById } from "@/lib/admin-users";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditUserPage({ params }: PageProps) {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_EDIT")) {
    redirect("/dashboard/users");
  }

  const { id } = await params;
  const [user, roles] = await Promise.all([getUserById(id), getRoleOptions()]);

  if (!user) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <UserForm
            mode="edit"
            actionUrl={`/api/users/${id}`}
            roles={roles}
            initialValues={{
              ...user,
              profileImage: user.profileImage ?? undefined,
            }}
          />
        </div>
      </div>
    </main>
  );
}
