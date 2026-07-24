import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getSettings } from "@/lib/admin-sales";
import { Button } from "@/components/ui/button";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_VIEW"))
    redirect("/dashboard");
  const settings = await getSettings();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Configuration</p>
            <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              App-wide configuration values and the editable option catalogs.
            </p>
          </div>
          <Link href="/dashboard/settings/reference-data">
            <Button variant="outline">Reference data →</Button>
          </Link>
        </div>

        <div className="mt-8 overflow-hidden rounded-3xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody>
              {settings.length ? (
                settings.map((setting) => (
                  <tr key={String(setting._id)} className="border-b last:border-b-0">
                    <td className="px-4 py-4 font-mono text-xs">
                      {String(setting.key ?? "")}
                    </td>
                    <td className="px-4 py-4">
                      {JSON.stringify(setting.value ?? null)}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {String(setting.description ?? "")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-8 text-muted-foreground" colSpan={3}>
                    No settings found.
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
