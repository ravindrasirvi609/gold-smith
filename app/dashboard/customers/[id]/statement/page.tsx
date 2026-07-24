import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomerStatement } from "@/lib/admin-sales";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Customer statement — every invoice, every payment, running balance.
 * Useful when a customer calls to reconcile or when you generate a
 * monthly statement PDF.
 */
export default async function CustomerStatementPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_VIEW"))
    redirect("/dashboard/customers");
  const { id } = await params;
  const statement = await getCustomerStatement(id);
  if (!statement) notFound();
  const { customer, invoices, payments, totals } = statement;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Customers", href: "/dashboard/customers" },
            { label: customer.name || customer.code },
            { label: "Statement" },
          ]}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Customer statement</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {customer.code} · {customer.mobile || "—"}
              {customer.email ? ` · ${customer.email}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/customers/${id}/edit`}>
              <Button variant="outline">Edit</Button>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Kpi label="Total billed" value={totals.billed} />
          <Kpi label="Total paid" value={totals.paid} />
          <Kpi label="Balance due" value={totals.balance} highlight />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Invoices</h2>
          <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Invoice No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.length ? (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">
                        {inv.invoiceNo}
                      </td>
                      <td className="px-4 py-3">{inv.date || "—"}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {inv.grandTotal}
                      </td>
                      <td className="px-4 py-3">{inv.status}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="text-sm underline underline-offset-4"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No invoices for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Payments</h2>
          <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Payment No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((p) => (
                    <tr key={p.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">
                        {p.paymentNo}
                      </td>
                      <td className="px-4 py-3">{p.date || "—"}</td>
                      <td className="px-4 py-3">{p.type}</td>
                      <td className="px-4 py-3 tabular-nums">{p.amount}</td>
                      <td className="px-4 py-3">{p.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No payments for this customer.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${highlight ? "border-primary/40" : ""}`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${highlight ? "text-primary" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
