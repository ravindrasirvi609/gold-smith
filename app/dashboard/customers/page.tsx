import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomers } from "@/lib/admin-customers";
import { EntityAvatar } from "@/components/ui/entity-avatar";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { parseListQuery } from "@/lib/list-query";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Active", value: "ACTIVE" },
  { label: "Inactive", value: "INACTIVE" },
  { label: "Blocked", value: "BLOCKED" },
];

export default async function CustomersPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getCustomers(query);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Master data</p>
            <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage customer records used in approval and billing.
            </p>
          </div>
          {hasPermission(session, "CUSTOMER_CREATE") ? (
            <Link href="/dashboard/customers/new">
              <Button>Create customer</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by code, name, mobile, email, city…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 w-12"></th>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Mobile</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4">
                      <EntityAvatar
                        src={customer.photoUrl || null}
                        name={[customer.firstName, customer.lastName].filter(Boolean).join(" ")}
                      />
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{customer.customerCode}</td>
                    <td className="px-4 py-4">
                      {customer.firstName} {customer.lastName}
                    </td>
                    <td className="px-4 py-4">{customer.mobile}</td>
                    <td className="px-4 py-4">{customer.city}</td>
                    <td className="px-4 py-4">{customer.status}</td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "CUSTOMER_EDIT") ? (
                        <Link
                          href={`/dashboard/customers/${customer.id}/edit`}
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
                  <td className="px-4 py-8 text-muted-foreground" colSpan={7}>
                    No customers found.
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
