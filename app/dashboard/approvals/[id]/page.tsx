import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getApprovalById } from "@/lib/admin-sales";
import { Button } from "@/components/ui/button";

type PageProps = { params: Promise<{ id: string }> };

/**
 * Read-only approval detail page. Cancel / return / delete actions live on
 * the approval list row — this page focuses on visibility.
 */
export default async function ApprovalDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_VIEW"))
    redirect("/dashboard/approvals");
  const { id } = await params;
  const approval = await getApprovalById(id);
  if (!approval) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Sales / Approval</p>
            <h1 className="text-3xl font-semibold">
              Approval details
            </h1>
          </div>
          <Link href="/dashboard/approvals">
            <Button variant="outline">Back to approvals</Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Field label="Status" value={approval.status} />
          <Field label="Issue date" value={approval.issueDate || "—"} />
          <Field
            label="Expected return"
            value={approval.expectedReturnDate || "—"}
          />
          <Field label="Purpose" value={approval.purpose || "—"} />
          <Field
            className="sm:col-span-2"
            label="Remarks"
            value={approval.remarks || "—"}
          />
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Jewel code</th>
                <th className="px-4 py-3">Issue weight</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {approval.products.length ? (
                approval.products.map((product, index) => (
                  <tr key={index} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">
                      {String((product as { jewelCode?: string }).jewelCode ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((product as { issueWeight?: string }).issueWeight ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((product as { quantity?: string }).quantity ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {String((product as { remarks?: string }).remarks ?? "")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={4}>
                    No products on this approval.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border bg-card p-4 ${className ?? ""}`}>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-sm">{value}</p>
    </div>
  );
}
