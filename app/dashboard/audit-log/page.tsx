import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getAuditLogs } from "@/lib/admin-sales";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { parseListQuery } from "@/lib/list-query";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MODULE_OPTIONS = [
  { label: "Invoice", value: "Invoice" },
  { label: "Approval", value: "Approval" },
  { label: "Payment", value: "Payment" },
  { label: "Settings", value: "Settings" },
];

function fmtDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "AUDIT_VIEW")) redirect("/dashboard");
  const query = parseListQuery(await searchParams, {
    defaultPageSize: 50,
  });
  const result = await getAuditLogs(query);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <h1 className="text-3xl font-semibold">Audit Log</h1>

        <div className="mt-6">
          <ListToolbar
            searchPlaceholder="Search by module, action, description…"
            statusOptions={MODULE_OPTIONS}
            statusLabel="Module"
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {result.items.length ? (
                result.items.map((log) => (
                  <tr key={log.id} className="border-b last:border-b-0">
                    <td className="px-4 py-4 text-muted-foreground">
                      {fmtDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-4">{log.module}</td>
                    <td className="px-4 py-4">{log.action}</td>
                    <td className="px-4 py-4">
                      {log.userName || "System"}
                      {log.userEmail ? (
                        <span className="ml-1 text-xs text-muted-foreground">
                          ({log.userEmail})
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">{log.description}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={5}>
                    No audit logs found.
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
