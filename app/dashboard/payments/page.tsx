import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getPayments } from "@/lib/admin-sales";

export default async function PaymentsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_VIEW")) redirect("/dashboard");
  const payments = await getPayments();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-10"><div className="w-full"><h1 className="text-3xl font-semibold">Payments</h1><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Payment No</th><th className="px-4 py-3">Invoice</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Attachment</th></tr></thead><tbody>{payments.length ? payments.map((payment) => <tr key={payment.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{payment.paymentNo}</td><td className="px-4 py-4">{payment.invoiceNo}</td><td className="px-4 py-4">{payment.customerName}</td><td className="px-4 py-4">{payment.paymentType}</td><td className="px-4 py-4">{payment.amount}</td><td className="px-4 py-4">{payment.status}</td><td className="px-4 py-4">{payment.attachmentUrl ? <a href={payment.attachmentUrl} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-4">View</a> : <span className="text-muted-foreground">—</span>}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={7}>No payments found.</td></tr>}</tbody></table></div></div></div></main>;
}

