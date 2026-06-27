import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";

export default async function InventoryHomePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_VIEW")) redirect("/dashboard");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="grid w-full gap-4 md:grid-cols-2"><Link href="/dashboard/gold-purchases" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Gold purchases</h1><p className="mt-2 text-sm text-muted-foreground">Manage gold purchase invoices and ledger entries.</p></Link><Link href="/dashboard/diamond-purchases" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Diamond purchases</h1><p className="mt-2 text-sm text-muted-foreground">Manage diamond purchase invoices and ledger entries.</p></Link></div></div></main>;
}

