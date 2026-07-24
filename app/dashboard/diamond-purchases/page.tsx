import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import {
  getDiamondPurchases,
  getDiamondInventorySummary,
} from "@/lib/admin-inventory";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { parseListQuery } from "@/lib/list-query";
import { EmptyState } from "@/components/ui/empty-state";
import { Gem } from "lucide-react";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default async function DiamondPurchasesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const [result, summary] = await Promise.all([
    getDiamondPurchases(query),
    getDiamondInventorySummary(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Inventory</p>
            <h1 className="text-3xl font-semibold tracking-tight">Diamond purchases</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ledger-backed diamond procurement.
            </p>
          </div>
          {hasPermission(session, "PURCHASE_CREATE") ? (
            <Link href="/dashboard/diamond-purchases/new">
              <Button>Create diamond purchase</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Current carat</p>
            <p className="mt-2 text-2xl font-semibold">
              {Number(summary.currentCarat ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Current pcs</p>
            <p className="mt-2 text-2xl font-semibold">
              {Number(summary.currentPcs ?? 0).toFixed(0)}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total carat in</p>
            <p className="mt-2 text-2xl font-semibold">
              {Number(summary.totalCaratIn ?? 0).toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by purchase or invoice number…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Invoice</th>
                <th className="px-4 py-3">Purchase Date</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((purchase) => (
                  <tr key={purchase.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{purchase.purchaseNo}</td>
                    <td className="px-4 py-4">{purchase.vendorName}</td>
                    <td className="px-4 py-4">{purchase.invoiceNo || "—"}</td>
                    <td className="px-4 py-4">{purchase.purchaseDate || "—"}</td>
                    <td className="px-4 py-4">{purchase.total}</td>
                    <td className="px-4 py-4">{purchase.status}</td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "PURCHASE_EDIT") ? (
                        <Link
                          href={`/dashboard/diamond-purchases/${purchase.id}/edit`}
                          className="text-sm underline underline-offset-4"
                        >
                          Edit
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">No actions</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={Gem}
                      title="No diamond purchases yet"
                      description="Create a purchase to start the diamond ledger."
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
