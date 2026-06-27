import { notFound, redirect } from "next/navigation";
import { KarigarIssueForm } from "@/components/manufacturing/karigar-issue-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getIssueById } from "@/lib/admin-manufacturing";
import { getKarigars } from "@/lib/admin-karigars";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditIssuePage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_EDIT")) redirect("/dashboard/manufacturing/issues");
  const { id } = await params;
  const [issue, karigars] = await Promise.all([getIssueById(id), getKarigars()]);
  if (!issue) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="w-full"><KarigarIssueForm mode="edit" actionUrl={`/api/karigar-issues/${id}`} karigars={karigars.map((karigar) => ({ id: karigar.id, name: karigar.name }))} initialValues={issue} canDelete={hasPermission(session, "ISSUE_DELETE")} /></div></div></main>;
}

