import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";

export default async function SalesHomePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_VIEW")) redirect("/dashboard");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10"><div className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"><Link href="/dashboard/approvals" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Approvals</h1><p className="mt-2 text-sm text-muted-foreground">Issue jewellery on approval.</p></Link><Link href="/dashboard/invoices" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Invoices</h1><p className="mt-2 text-sm text-muted-foreground">Create sales invoices.</p></Link><Link href="/dashboard/payments" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Payments</h1><p className="mt-2 text-sm text-muted-foreground">Track customer payments.</p></Link><Link href="/dashboard/settings" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-2 text-sm text-muted-foreground">Dynamic ERP configuration.</p></Link><Link href="/dashboard/audit-log" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Audit Log</h1><p className="mt-2 text-sm text-muted-foreground">Immutable operation history.</p></Link></div></div></main>;
}

