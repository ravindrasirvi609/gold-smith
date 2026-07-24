import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getPayments } from "@/lib/admin-sales";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { RowActionButton } from "@/components/ui/row-action-button";
import { parseListQuery } from "@/lib/list-query";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Partial", value: "PARTIAL" },
  { label: "Paid", value: "PAID" },
  { label: "Refunded", value: "REFUNDED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default async function PaymentsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getPayments(query);
  const canEdit = hasPermission(session, "PAYMENT_EDIT");
  const canDelete = hasPermission(session, "PAYMENT_DELETE");
  const hasActions = canEdit || canDelete;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <h1 className="text-3xl font-semibold">Payments</h1>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by payment number, type, reference…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Payment No</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Attachment</th>
                {hasActions ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((payment) => (
                  <tr key={payment.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{payment.paymentNo}</td>
                    <td className="px-4 py-4">{payment.invoiceNo}</td>
                    <td className="px-4 py-4">{payment.customerName}</td>
                    <td className="px-4 py-4">{payment.paymentType}</td>
                    <td className="px-4 py-4">{payment.amount}</td>
                    <td className="px-4 py-4">{payment.status}</td>
                    <td className="px-4 py-4">
                      {payment.attachmentUrl ? (
                        <a
                          href={payment.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline underline-offset-4"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    {hasActions ? (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {canEdit &&
                          payment.status !== "REFUNDED" &&
                          payment.status !== "CANCELLED" ? (
                            <RowActionButton
                              url={`/api/payments/${payment.id}/refund`}
                              method="POST"
                              confirm={`Refund payment ${payment.paymentNo}?`}
                              successMessage="Payment refunded."
                              className="text-amber-700 dark:text-amber-400"
                            >
                              Refund
                            </RowActionButton>
                          ) : null}
                          {canDelete && payment.status === "PENDING" ? (
                            <RowActionButton
                              url={`/api/payments/${payment.id}`}
                              method="DELETE"
                              confirm={`Delete pending payment ${payment.paymentNo}?`}
                              successMessage="Payment deleted."
                              className="text-destructive"
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
                  <td
                    className="px-4 py-8 text-muted-foreground"
                    colSpan={hasActions ? 8 : 7}
                  >
                    No payments found.
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
