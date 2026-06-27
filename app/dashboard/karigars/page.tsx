import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getKarigars } from "@/lib/admin-karigars";

export default async function KarigarsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "KARIGAR_VIEW")) redirect("/dashboard");
  const karigars = await getKarigars();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-muted-foreground">Master data</p><h1 className="text-3xl font-semibold tracking-tight">Karigars</h1><p className="mt-2 text-sm text-muted-foreground">Manage craftsman records for issue and receipt flows.</p></div>{hasPermission(session, "KARIGAR_CREATE") ? <Link href="/dashboard/karigars/new"><Button>Create karigar</Button></Link> : null}</div><div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Specialization</th><th className="px-4 py-3 font-medium">Labour rate</th><th className="px-4 py-3 font-medium">Pending issue</th><th className="px-4 py-3 font-medium">Pending receipt</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead><tbody>{karigars.length ? karigars.map((karigar) => <tr key={karigar.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{karigar.karigarCode}</td><td className="px-4 py-4">{karigar.name}</td><td className="px-4 py-4">{karigar.specialization || "—"}</td><td className="px-4 py-4">{karigar.labourRate || "—"}</td><td className="px-4 py-4">{karigar.pendingIssue}</td><td className="px-4 py-4">{karigar.pendingReceipt}</td><td className="px-4 py-4">{karigar.status}</td><td className="px-4 py-4">{hasPermission(session, "KARIGAR_EDIT") ? <Link href={`/dashboard/karigars/${karigar.id}/edit`} className="text-sm underline underline-offset-4">Edit</Link> : <span className="text-muted-foreground">No actions</span>}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={8}>No karigars found.</td></tr>}</tbody></table></div></div></main>;
}

