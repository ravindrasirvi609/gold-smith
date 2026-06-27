import { redirect } from "next/navigation";
import { KarigarForm } from "@/components/karigars/karigar-form";
import { getSession, hasPermission } from "@/lib/auth";

export default async function NewKarigarPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "KARIGAR_CREATE")) redirect("/dashboard/karigars");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><KarigarForm mode="create" actionUrl="/api/karigars" /></div></div></main>;
}

