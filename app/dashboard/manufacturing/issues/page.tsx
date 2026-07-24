import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getIssues } from "@/lib/admin-manufacturing";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { parseListQuery } from "@/lib/list-query";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const STATUS_OPTIONS = [
  { label: "Draft", value: "DRAFT" },
  { label: "Issued", value: "ISSUED" },
  { label: "Partially received", value: "PARTIALLY_RECEIVED" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" },
];

export default async function IssuesPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams);
  const result = await getIssues(query);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Manufacturing</p>
            <h1 className="text-3xl font-semibold">Karigar Issues</h1>
          </div>
          {hasPermission(session, "ISSUE_CREATE") ? (
            <Link href="/dashboard/manufacturing/issues/new">
              <Button>Create issue</Button>
            </Link>
          ) : null}
        </div>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by issue number, design reference…"
            statusOptions={STATUS_OPTIONS}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Issue No</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Karigar</th>
                <th className="px-4 py-3">Gold</th>
                <th className="px-4 py-3">Diamond</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((issue) => (
                  <tr key={issue.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">{issue.issueNo}</td>
                    <td className="px-4 py-4">{issue.issueDate || "—"}</td>
                    <td className="px-4 py-4">{issue.karigarName}</td>
                    <td className="px-4 py-4">{issue.goldCount}</td>
                    <td className="px-4 py-4">{issue.diamondCount}</td>
                    <td className="px-4 py-4">{issue.status}</td>
                    <td className="px-4 py-4">
                      {hasPermission(session, "ISSUE_EDIT") ? (
                        <Link
                          href={`/dashboard/manufacturing/issues/${issue.id}/edit`}
                          className="underline underline-offset-4"
                        >
                          Edit
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={7}>
                    No issues found.
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
