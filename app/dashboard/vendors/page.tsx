import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getVendors } from "@/lib/admin-vendors";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { ExportCsvButton } from "@/components/ui/export-csv-button";
import { Building2 } from "lucide-react";
import { parseListQuery } from "@/lib/list-query";
import { StatusBadge } from "@/components/ui/status-badge";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
];

export default async function VendorsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_VIEW")) redirect("/dashboard");

  const query = parseListQuery(await searchParams);
  const result = await getVendors(query);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Master data</p>
            <h1 className="text-3xl font-semibold tracking-tight">Vendors</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage supplier records used in purchases.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportCsvButton endpoint="/api/vendors/export" />
            {hasPermission(session, "VENDOR_CREATE") ? (
              <Link href="/dashboard/vendors/new">
                <Button>Create vendor</Button>
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by code, company, owner, mobile, GST…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">GST</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((vendor) => (
                  <tr key={vendor.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      <EntityAvatar
                        src={vendor.logoUrl || null}
                        name={vendor.companyName || vendor.ownerName}
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{vendor.vendorCode}</td>
                    <td className="px-4 py-4">{vendor.companyName}</td>
                    <td className="px-4 py-4">{vendor.ownerName}</td>
                    <td className="px-4 py-4">{vendor.mobile}</td>
                    <td className="px-4 py-4">{vendor.gstNumber || "—"}</td>
                    <td className="px-4 py-4">{vendor.vendorType}</td>
                    <td className="px-4 py-4"><StatusBadge status={vendor.status} /></td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "VENDOR_EDIT") ? (
                        <Link
                          href={`/dashboard/vendors/${vendor.id}/edit`}
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
                  <td colSpan={9}>
                    <EmptyState
                      icon={Building2}
                      title="No vendors found"
                      description="Add a vendor to start tracking purchases and KYC."
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
