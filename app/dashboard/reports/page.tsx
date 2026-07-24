import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import {
  getReportsData,
  RANGE_LABELS,
  type RangeKey,
} from "@/lib/admin-reports";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const RANGES: RangeKey[] = ["last_7", "last_30", "last_90", "ytd", "all"];

function readRange(params: Record<string, string | string[] | undefined>): RangeKey {
  const raw = params.range;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return (RANGES as readonly string[]).includes(String(value ?? ""))
    ? (value as RangeKey)
    : "last_30";
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "DASHBOARD_VIEW"))
    redirect("/dashboard");

  const params = await searchParams;
  const range = readRange(params);
  const data = await getReportsData(range);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Reports" }]}
          className="mb-4"
        />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Analytics</p>
            <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sales performance, aging, top customers, top products, and
              inventory valuation.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/dashboard/reports?range=${r}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  r === range
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input bg-background hover:bg-muted"
                }`}
              >
                {RANGE_LABELS[r]}
              </Link>
            ))}
          </nav>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <Kpi label="Invoices" value={String(data.totals.invoicesCount)} />
          <Kpi label="Revenue" value={data.totals.revenue} highlight />
          <Kpi label="Average invoice" value={data.totals.averageInvoice} />
          <Kpi label="Payments collected" value={data.totals.collected} />
          <Kpi label="Payment count" value={String(data.totals.paymentsCount)} />
          <Kpi
            label="Outstanding"
            value={data.totals.outstanding}
            tone="warning"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold">Top customers</h2>
            <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Invoices</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topCustomers.length ? (
                    data.topCustomers.map((row, index) => (
                      <tr key={index} className="border-b last:border-b-0">
                        <td className="px-4 py-3">{row.name}</td>
                        <td className="px-4 py-3">{row.count}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.total}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-muted-foreground"
                        colSpan={3}
                      >
                        No customer activity in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Top products</h2>
            <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Jewel code</th>
                    <th className="px-4 py-3 text-right">Sales count</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.length ? (
                    data.topProducts.map((row) => (
                      <tr key={row.jewelCode} className="border-b last:border-b-0">
                        <td className="px-4 py-3 font-mono text-xs">
                          {row.jewelCode}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {row.count}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-4 py-6 text-center text-muted-foreground"
                        colSpan={2}
                      >
                        No product sales in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold">Receivables aging</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Unpaid invoices bucketed by age. Independent of the selected range.
            </p>
            <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Bucket</th>
                    <th className="px-4 py-3">Invoices</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.aging.map((row) => (
                    <tr key={row.bucket} className="border-b last:border-b-0">
                      <td className="px-4 py-3">{row.bucket}</td>
                      <td className="px-4 py-3">{row.count}</td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {row.total}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold">Inventory snapshot</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Current stock across gold, diamonds, and finished jewellery.
            </p>
            <div className="mt-3 space-y-3">
              <Kpi label="Gold (grams)" value={data.inventory.goldGrams} />
              <Kpi label="Diamonds (carats)" value={data.inventory.diamondCarats} />
              <Kpi
                label="Available products"
                value={String(data.inventory.availableProducts)}
              />
            </div>
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
  tone,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tone?: "warning";
}) {
  return (
    <div
      className={`rounded-2xl border bg-card p-4 ${
        highlight
          ? "border-primary/40"
          : tone === "warning"
          ? "border-amber-300 dark:border-amber-700/40"
          : ""
      }`}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-2xl font-semibold tabular-nums ${
          highlight
            ? "text-primary"
            : tone === "warning"
            ? "text-amber-700 dark:text-amber-400"
            : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
