import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getInvoiceById } from "@/lib/admin-sales";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Read-only invoice detail page. Cancel + delete actions live on the
 * invoice list row.
 */
export default async function InvoiceDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_VIEW"))
    redirect("/dashboard/invoices");
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Sales", href: "/dashboard/sales" },
            { label: "Invoices", href: "/dashboard/invoices" },
            { label: "Details" },
          ]}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sales / Invoice</p>
            <h1 className="text-3xl font-semibold">Invoice details</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/invoices/${invoice.id}/print`}>
              <Button variant="outline">Print / PDF</Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button variant="outline">Back to invoices</Button>
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Status" value={invoice.paymentStatus} />
          <Field label="Invoice date" value={invoice.invoiceDate || "—"} />
          <Field label="Sale type" value={invoice.saleType || "—"} />
          <Field
            label="Linked approval"
            value={invoice.approvalId || "—"}
          />
          <Field
            className="sm:col-span-2"
            label="Remarks"
            value={invoice.remarks || "—"}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Jewel code</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Gold rate</th>
                <th className="px-4 py-3">Making</th>
                <th className="px-4 py-3">Stone</th>
                <th className="px-4 py-3">GST</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products.length ? (
                invoice.products.map((row, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">
                      {String((row as { jewelCode?: string }).jewelCode ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { quantity?: string }).quantity ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { goldRate?: string }).goldRate ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { makingCharge?: string }).makingCharge ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { stoneAmount?: string }).stoneAmount ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { gst?: string }).gst ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((row as { discount?: string }).discount ?? "")}
                    </td>
                    <td className="px-4 py-4 font-medium">
                      {String((row as { total?: string }).total ?? "")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={8}>
                    No line items on this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm">{value}</p>
    </div>
  );
}
