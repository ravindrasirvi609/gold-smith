import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getInvoices } from "@/lib/admin-sales";

export default async function InvoicesPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_VIEW")) redirect("/dashboard");
  const invoices = await getInvoices();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-10"><div className="w-full"><h1 className="text-3xl font-semibold">Invoices</h1><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Invoice No</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Grand Total</th><th className="px-4 py-3">Status</th></tr></thead><tbody>{invoices.length ? invoices.map((invoice) => <tr key={invoice.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{invoice.invoiceNo}</td><td className="px-4 py-4">{invoice.customerName}</td><td className="px-4 py-4">{invoice.invoiceDate || "—"}</td><td className="px-4 py-4">{invoice.grandTotal}</td><td className="px-4 py-4">{invoice.paymentStatus}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No invoices found.</td></tr>}</tbody></table></div></div></div></main>;
}

