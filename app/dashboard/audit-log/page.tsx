import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getAuditLogs } from "@/lib/admin-sales";

export default async function AuditLogPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "AUDIT_VIEW")) redirect("/dashboard");
  const logs = await getAuditLogs();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-10"><div className="w-full"><h1 className="text-3xl font-semibold">Audit Log</h1><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Description</th></tr></thead><tbody>{logs.length ? logs.map((log) => <tr key={String(log._id)} className="border-b last:border-b-0"><td className="px-4 py-4">{String(log.createdAt ?? "")}</td><td className="px-4 py-4">{String(log.module ?? "")}</td><td className="px-4 py-4">{String(log.action ?? "")}</td><td className="px-4 py-4">{String(log.userDoc?.firstName ?? "System")}</td><td className="px-4 py-4">{String(log.description ?? "")}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No audit logs found.</td></tr>}</tbody></table></div></div></div></main>;
}

