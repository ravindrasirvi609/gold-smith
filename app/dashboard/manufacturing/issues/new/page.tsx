import { redirect } from "next/navigation";
import { KarigarIssueForm } from "@/components/manufacturing/karigar-issue-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getKarigarOptions } from "@/lib/admin-karigars";

export default async function NewIssuePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_CREATE"))
    redirect("/dashboard/manufacturing/issues");
  const karigars = (await getKarigarOptions()).map((k) => ({
    id: k.id,
    name: k.name,
  }));
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10">
        <div className="w-full">
          <KarigarIssueForm
            mode="create"
            actionUrl="/api/karigar-issues"
            karigars={karigars}
          />
        </div>
      </div>
    </main>
  );
}
