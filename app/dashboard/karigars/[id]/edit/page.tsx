import { notFound, redirect } from "next/navigation";
import { KarigarForm } from "@/components/karigars/karigar-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getKarigarById } from "@/lib/admin-karigars";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditKarigarPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "KARIGAR_EDIT")) redirect("/dashboard/karigars");
  const { id } = await params;
  const karigar = await getKarigarById(id);
  if (!karigar) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><KarigarForm mode="edit" actionUrl={`/api/karigars/${id}`} initialValues={karigar} canDelete={hasPermission(session, "KARIGAR_DELETE")} /></div></div></main>;
}

