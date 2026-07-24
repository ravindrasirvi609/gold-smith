import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getReceipts } from "@/lib/admin-manufacturing";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { parseListQuery } from "@/lib/list-query";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageCheck } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatINR, formatDate } from "@/lib/formatters";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Rejected", value: "REJECTED" },
];

export default async function ReceiptsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getReceipts(query);
  const canEdit = hasPermission(session, "RECEIPT_EDIT");

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Manufacturing</p>
            <h1 className="text-3xl font-semibold tracking-tight">Karigar receipts</h1>
          </div>
          {hasPermission(session, "RECEIPT_CREATE") ? (
            <Link href="/dashboard/manufacturing/receipts/new">
              <Button>Create receipt</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by receipt number…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Receipt No</th>
                <th className="px-4 py-3">Receive Date</th>
                <th className="px-4 py-3">Karigar</th>
                <th className="px-4 py-3">Labour</th>
                <th className="px-4 py-3">Status</th>
                {canEdit ? <th className="px-4 py-3">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((receipt) => (
                  <tr key={receipt.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{receipt.receiptNo}</td>
                    <td className="px-4 py-4">{formatDate(receipt.receiveDate)}</td>
                    <td className="px-4 py-4">{receipt.karigarName}</td>
                    <td className="px-4 py-4 tabular-nums">{formatINR(receipt.labourCharge)}</td>
                    <td className="px-4 py-4"><StatusBadge status={receipt.status} /></td>
                    {canEdit ? (
                      <td className="px-4 py-4">
                        <Link
                          href={`/dashboard/manufacturing/receipts/${receipt.id}/edit`}
                          className="underline underline-offset-4"
                        >
                          Edit
                        </Link>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canEdit ? 6 : 5}>
                    <EmptyState
                      icon={PackageCheck}
                      title="No karigar receipts yet"
                      description="Receive finished jewellery from a karigar."
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
