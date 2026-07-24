import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getKarigarReconciliation } from "@/lib/admin-manufacturing";
import { Button } from "@/components/ui/button";
import { PageBreadcrumbs } from "@/components/ui/page-breadcrumbs";

type PageProps = { params: Promise<{ id: string }> };

export default async function KarigarReconciliationPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "KARIGAR_VIEW"))
    redirect("/dashboard/karigars");
  const { id } = await params;
  const rec = await getKarigarReconciliation(id);
  if (!rec) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <PageBreadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Karigars", href: "/dashboard/karigars" },
            { label: rec.karigar.name || rec.karigar.code },
            { label: "Reconciliation" },
          ]}
          className="mb-4"
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Karigar reconciliation</p>
            <h1 className="text-3xl font-semibold tracking-tight">
              {rec.karigar.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {rec.karigar.code} · {rec.karigar.mobile || "—"}
              {rec.karigar.specialization
                ? ` · ${rec.karigar.specialization}`
                : ""}
            </p>
          </div>
          <Link href={`/dashboard/karigars/${id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Kpi label="Total labour paid" value={rec.totals.totalLabour} highlight />
          <Kpi label="Open issues" value={String(rec.totals.openIssues)} />
          <Kpi label="Pending receipts" value={String(rec.totals.pendingReceipts)} />
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Issues</h2>
          <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Issue No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Gold items</th>
                  <th className="px-4 py-3">Diamond items</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rec.issues.length ? (
                  rec.issues.map((iss) => (
                    <tr key={iss.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/dashboard/manufacturing/issues/${iss.id}/edit`}
                          className="underline underline-offset-4"
                        >
                          {iss.issueNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{iss.issueDate || "—"}</td>
                      <td className="px-4 py-3">{iss.goldCount}</td>
                      <td className="px-4 py-3">{iss.diamondCount}</td>
                      <td className="px-4 py-3">{iss.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No issues for this karigar.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Receipts</h2>
          <div className="mt-3 overflow-hidden rounded-3xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Receipt No</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Labour</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {rec.receipts.length ? (
                  rec.receipts.map((r) => (
                    <tr key={r.id} className="border-b last:border-b-0">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link
                          href={`/dashboard/manufacturing/receipts/${r.id}/edit`}
                          className="underline underline-offset-4"
                        >
                          {r.receiptNo}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{r.receiveDate || "—"}</td>
                      <td className="px-4 py-3">{r.jewelleryCount}</td>
                      <td className="px-4 py-3 tabular-nums">{r.labourCharge}</td>
                      <td className="px-4 py-3">{r.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      No receipts for this karigar.
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
