import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getApprovals } from "@/lib/admin-sales";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { RowActionButton } from "@/components/ui/row-action-button";
import { parseListQuery } from "@/lib/list-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Handshake } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDate } from "@/lib/formatters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Partially returned", value: "PARTIALLY_RETURNED" },
  { label: "Returned", value: "RETURNED" },
  { label: "Converted", value: "CONVERTED_TO_SALE" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Expired", value: "EXPIRED" },
];

export default async function ApprovalsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getApprovals(query);
  const canEdit = hasPermission(session, "APPROVAL_EDIT");
  const canDelete = hasPermission(session, "APPROVAL_DELETE");
  const hasActions = canEdit || canDelete;

  const cancellable = new Set(["DRAFT", "ISSUED", "PARTIALLY_RETURNED"]);
  const deletable = new Set(["DRAFT", "CANCELLED"]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Sales</p>
            <h1 className="text-3xl font-semibold tracking-tight">Approvals</h1>
          </div>
          {hasPermission(session, "APPROVAL_CREATE") ? (
            <Link href="/dashboard/approvals/new">
              <Button>Create approval</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by approval number or purpose…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Approval No</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Issue Date</th>
                <th className="px-4 py-3">Return Date</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Status</th>
                {hasActions ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((approval) => (
                  <tr key={approval.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{approval.approvalNo}</td>
                    <td className="px-4 py-4">{approval.customerName}</td>
                    <td className="px-4 py-4">{formatDate(approval.issueDate)}</td>
                    <td className="px-4 py-4">{formatDate(approval.expectedReturnDate)}</td>
                    <td className="px-4 py-4">{approval.productCount}</td>
                    <td className="px-4 py-4"><StatusBadge status={approval.status} /></td>
                    {hasActions ? (
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {canEdit ? (
                            <Link
                              href={`/dashboard/approvals/${approval.id}`}
                              className="text-sm underline underline-offset-4"
                            >
                              View
                            </Link>
                          ) : null}
                          {canEdit && cancellable.has(approval.status) ? (
                            <RowActionButton
                              url={`/api/approvals/${approval.id}/cancel`}
                              method="POST"
                              tone="warning"
                              confirmTitle={`Cancel approval ${approval.approvalNo}?`}
                              confirmDescription="All products still on this approval will return to stock. The approval record is kept for audit."
                              successMessage="Approval cancelled."
                            >
                              Cancel
                            </RowActionButton>
                          ) : null}
                          {canDelete && deletable.has(approval.status) ? (
                            <RowActionButton
                              url={`/api/approvals/${approval.id}`}
                              method="DELETE"
                              tone="danger"
                              confirmTitle={`Delete approval ${approval.approvalNo}?`}
                              confirmDescription="This permanently removes the approval. Only drafts and cancelled approvals can be deleted."
                              successMessage="Approval deleted."
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
                  <td colSpan={hasActions ? 7 : 6}>
                    <EmptyState
                      icon={Handshake}
                      title="No approvals found"
                      description="Create an approval when a customer takes jewellery on trial."
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
