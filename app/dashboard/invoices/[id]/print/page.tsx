import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getInvoicePrintData } from "@/lib/admin-sales";
import { PrintButton } from "./print-button";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Print-friendly invoice. Uses standard document layout (no dashboard
 * chrome), CSS `@media print` rules to hide interactive elements, and
 * shows all the numeric detail an accountant needs.
 */
export default async function InvoicePrintPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_VIEW"))
    redirect("/dashboard/invoices");
  const { id } = await params;
  const invoice = await getInvoicePrintData(id);
  if (!invoice) notFound();

  return (
    <main className="min-h-screen bg-white text-black print:bg-white">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          nav, header, footer, .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between no-print">
          <a
            href={`/dashboard/invoices/${id}`}
            className="text-sm underline underline-offset-4 text-neutral-700"
          >
            ← Back to invoice
          </a>
          <PrintButton />
        </div>

        <header className="mb-8 flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {invoice.business.name}
            </h1>
            {invoice.business.address ? (
              <p className="mt-1 text-sm text-neutral-600 whitespace-pre-line">
                {invoice.business.address}
              </p>
            ) : null}
            <div className="mt-2 text-xs text-neutral-500 space-x-2">
              {invoice.business.gst ? <span>GST: {invoice.business.gst}</span> : null}
              {invoice.business.phone ? <span>· {invoice.business.phone}</span> : null}
              {invoice.business.email ? <span>· {invoice.business.email}</span> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Tax Invoice
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {invoice.invoiceNo}
            </p>
            <p className="mt-1 text-xs text-neutral-500">
              Date: {invoice.invoiceDate || "—"}
            </p>
            <p className="text-xs text-neutral-500">Sale: {invoice.saleType}</p>
            <p className="mt-2 inline-block rounded-full border border-neutral-200 px-2 py-0.5 text-xs">
              {invoice.paymentStatus}
            </p>
          </div>
        </header>

        <section className="mb-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
              Billed to
            </p>
            {invoice.customer ? (
              <>
                <p className="font-medium">{invoice.customer.name}</p>
                <p className="text-xs text-neutral-500">
                  {invoice.customer.code}
                </p>
                {invoice.customer.address ? (
                  <p className="mt-1 text-xs text-neutral-600">
                    {invoice.customer.address}
                  </p>
                ) : null}
                <div className="mt-1 text-xs text-neutral-600 space-x-2">
                  {invoice.customer.mobile ? (
                    <span>Mobile: {invoice.customer.mobile}</span>
                  ) : null}
                  {invoice.customer.email ? (
                    <span>· {invoice.customer.email}</span>
                  ) : null}
                </div>
                {invoice.customer.gst ? (
                  <p className="mt-1 text-xs text-neutral-600">
                    GST: {invoice.customer.gst}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="text-neutral-500">—</p>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-neutral-500">
              Payment summary
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Subtotal</dt>
                <dd className="tabular-nums">{invoice.subtotal}</dd>
              </div>
              <div className="flex justify-between font-medium">
                <dt>Grand total</dt>
                <dd className="tabular-nums">{invoice.grandTotal}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt>Paid</dt>
                <dd className="tabular-nums">{invoice.amountPaid}</dd>
              </div>
              <div className="flex justify-between border-t pt-1 font-semibold">
                <dt>Balance due</dt>
                <dd className="tabular-nums">{invoice.balanceDue}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-y border-neutral-300 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="py-2 px-2 text-left">Jewel</th>
                <th className="py-2 px-2 text-right">Qty</th>
                <th className="py-2 px-2 text-right">Rate</th>
                <th className="py-2 px-2 text-right">Making</th>
                <th className="py-2 px-2 text-right">Stone</th>
                <th className="py-2 px-2 text-right">GST</th>
                <th className="py-2 px-2 text-right">Discount</th>
                <th className="py-2 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.products.map((row, index) => {
                const r = row as Record<string, string>;
                return (
                  <tr key={index} className="border-b border-neutral-200">
                    <td className="py-2 px-2 font-mono text-xs">
                      {String(r.jewelCode ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.quantity ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.goldRate ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.makingCharge ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.stoneAmount ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.gst ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {String(r.discount ?? "")}
                    </td>
                    <td className="py-2 px-2 text-right font-medium tabular-nums">
                      {String(r.total ?? "")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        {invoice.remarks ? (
          <section className="mt-6">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Remarks
            </p>
            <p className="mt-1 text-sm text-neutral-700 whitespace-pre-line">
              {invoice.remarks}
            </p>
          </section>
        ) : null}

        <footer className="mt-16 border-t border-neutral-200 pt-6 text-xs text-neutral-500">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p>
                For any queries about this invoice, contact us using the details
                above.
              </p>
              <p className="mt-2">
                E. &amp; O. E. Subject to jurisdiction of applicable local courts.
              </p>
            </div>
            <div className="text-right">
              <div className="mt-8 border-t border-neutral-400 pt-1">
                <p className="text-xs">Authorised signatory</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
