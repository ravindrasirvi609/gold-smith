import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";

export default async function ManufacturingHomePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_VIEW")) redirect("/dashboard");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10"><div className="grid w-full gap-4 md:grid-cols-2"><Link href="/dashboard/manufacturing/issues" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Karigar Issues</h1><p className="mt-2 text-sm text-muted-foreground">Issue gold and diamonds to karigars.</p></Link><Link href="/dashboard/manufacturing/receipts" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Karigar Receipts</h1><p className="mt-2 text-sm text-muted-foreground">Receive finished jewellery and auto-create products.</p></Link><Link href="/dashboard/products" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Products</h1><p className="mt-2 text-sm text-muted-foreground">Browse generated product master records.</p></Link><Link href="/dashboard/product-history" className="rounded-3xl border bg-card p-6 shadow-sm"><h1 className="text-2xl font-semibold">Product History</h1><p className="mt-2 text-sm text-muted-foreground">Review every movement event.</p></Link></div></div></main>;
}

