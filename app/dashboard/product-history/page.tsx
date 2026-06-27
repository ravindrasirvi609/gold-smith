import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getHistory } from "@/lib/admin-manufacturing";

export default async function ProductHistoryPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "HISTORY_VIEW")) redirect("/dashboard");
  const history = await getHistory();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl px-6 py-10"><div className="w-full"><h1 className="text-3xl font-semibold">Product History</h1><div className="mt-8 overflow-hidden rounded-3xl border bg-card"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Event</th><th className="px-4 py-3">Reference</th><th className="px-4 py-3">Performed By</th><th className="px-4 py-3">Remarks</th></tr></thead><tbody>{history.length ? history.map((entry) => <tr key={String(entry._id)} className="border-b last:border-b-0"><td className="px-4 py-4">{String(entry.date ?? "")}</td><td className="px-4 py-4">{String(entry.event ?? "")}</td><td className="px-4 py-4">{String(entry.referenceId ?? "")}</td><td className="px-4 py-4">{String(entry.userDoc?.firstName ?? "System")}</td><td className="px-4 py-4">{String(entry.remarks ?? "")}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={5}>No history found.</td></tr>}</tbody></table></div></div></div></main>;
}

