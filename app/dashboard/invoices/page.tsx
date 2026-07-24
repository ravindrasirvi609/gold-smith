import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getInvoices } from "@/lib/admin-sales";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { RowActionButton } from "@/components/ui/row-action-button";
import { parseListQuery } from "@/lib/list-query";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportCsvButton } from "@/components/ui/export-csv-button";
import { Receipt } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/formatters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Pending payment", value: "PENDING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Partially paid", value: "PARTIALLY_PAID" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Returned", value: "RETURNED" },
];

export default async function InvoicesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getInvoices(query);
  const canEdit = hasPermission(session, "INVOICE_EDIT");
  const canDelete = hasPermission(session, "INVOICE_DELETE");
  const hasActions = canEdit || canDelete;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sales</p>
            <h1 className="text-3xl font-semibold tracking-tight">Invoices</h1>
          </div>
          <ExportCsvButton endpoint="/api/invoices/export" />
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by invoice number or sale type…"
            statusOptions={STATUS_OPTIONS}
            statusLabel="Payment"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Invoice No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Grand Total</th>
                <th className="px-4 py-3">Status</th>
                {hasActions ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((invoice) => (
                  <tr key={invoice.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{invoice.invoiceNo}</td>
                    <td className="px-4 py-4">{invoice.customerName}</td>
                    <td className="px-4 py-4">{formatDate(invoice.invoiceDate)}</td>
                    <td className="px-4 py-4 tabular-nums">{formatINR(invoice.grandTotal)}</td>
                    <td className="px-4 py-4"><StatusBadge status={invoice.paymentStatus} /></td>
                    {hasActions ? (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {canEdit ? (
                            <Link
                              href={`/dashboard/invoices/${invoice.id}`}
                              className="text-sm underline underline-offset-4"
                            >
                              View
                            </Link>
                          ) : null}
                          {canEdit &&
                          invoice.paymentStatus !== "CANCELLED" ? (
                            <RowActionButton
                              url={`/api/invoices/${invoice.id}/cancel`}
                              method="POST"
                              tone="warning"
                              confirmTitle={`Cancel invoice ${invoice.invoiceNo}?`}
                              confirmDescription="Products on this invoice will be returned to stock and any linked payments will be marked as refunded. The invoice will still be visible for audit purposes."
                              successMessage="Invoice cancelled."
                            >
                              Cancel
                            </RowActionButton>
                          ) : null}
                          {canDelete && invoice.paymentStatus === "DRAFT" ? (
                            <RowActionButton
                              url={`/api/invoices/${invoice.id}`}
                              method="DELETE"
                              tone="danger"
                              confirmTitle={`Delete draft invoice ${invoice.invoiceNo}?`}
                              confirmDescription="This will permanently delete the draft. Only drafts can be deleted — anything past draft must be cancelled instead."
                              successMessage="Invoice deleted."
                            >
                              Delete
                            </RowActionButton>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={hasActions ? 6 : 5}>
                    <EmptyState
                      icon={Receipt}
                      title="No invoices found"
                      description="Convert an approval to a sale or bill directly from stock."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            pageSize={result.pageSize}
          />
        </div>
      </div>
    </main>
  );
}
