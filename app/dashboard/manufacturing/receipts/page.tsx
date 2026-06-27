import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getReceipts } from "@/lib/admin-manufacturing";

export default async function ReceiptsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_VIEW")) redirect("/dashboard");
  const receipts = await getReceipts();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"><div className="flex items-end justify-between"><div><p className="text-sm text-muted-foreground">Manufacturing</p><h1 className="text-3xl font-semibold">Karigar Receipts</h1></div>{hasPermission(session, "RECEIPT_CREATE") ? <Link href="/dashboard/manufacturing/receipts/new"><Button>Create receipt</Button></Link> : null}</div><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Receipt No</th><th className="px-4 py-3">Receive Date</th><th className="px-4 py-3">Karigar</th><th className="px-4 py-3">Labour</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{receipts.length ? receipts.map((receipt) => <tr key={receipt.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{receipt.receiptNo}</td><td className="px-4 py-4">{receipt.receiveDate || "—"}</td><td className="px-4 py-4">{receipt.karigarName}</td><td className="px-4 py-4">{receipt.labourCharge}</td><td className="px-4 py-4">{receipt.status}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No receipts found.</td></tr>}</tbody></table></div></div></main>;
}

