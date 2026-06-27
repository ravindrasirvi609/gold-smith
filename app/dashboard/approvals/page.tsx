import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getApprovals } from "@/lib/admin-sales";

export default async function ApprovalsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_VIEW")) redirect("/dashboard");
  const approvals = await getApprovals();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"><div className="flex items-end justify-between"><div><p className="text-sm text-muted-foreground">Sales</p><h1 className="text-3xl font-semibold">Approvals</h1></div>{hasPermission(session, "APPROVAL_CREATE") ? <Link href="/dashboard/approvals/new"><Button>Create approval</Button></Link> : null}</div><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Approval No</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Issue Date</th><th className="px-4 py-3">Return Date</th><th className="px-4 py-3">Products</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{approvals.length ? approvals.map((approval) => <tr key={approval.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{approval.approvalNo}</td><td className="px-4 py-4">{approval.customerName}</td><td className="px-4 py-4">{approval.issueDate || "—"}</td><td className="px-4 py-4">{approval.expectedReturnDate || "—"}</td><td className="px-4 py-4">{approval.productCount}</td><td className="px-4 py-4">{approval.status}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={6}>No approvals found.</td></tr>}</tbody></table></div></div></main>;
}

