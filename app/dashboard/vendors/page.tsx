import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSession, hasPermission } from "@/lib/auth";
import { getVendors } from "@/lib/admin-vendors";

export default async function VendorsPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_VIEW")) redirect("/dashboard");
  const vendors = await getVendors();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-muted-foreground">Master data</p><h1 className="text-3xl font-semibold tracking-tight">Vendors</h1><p className="mt-2 text-sm text-muted-foreground">Manage supplier records used in purchases.</p></div>{hasPermission(session, "VENDOR_CREATE") ? <Link href="/dashboard/vendors/new"><Button>Create vendor</Button></Link> : null}</div><div className="mt-8 overflow-hidden rounded-3xl border bg-card shadow-sm"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Code</th><th className="px-4 py-3 font-medium">Company</th><th className="px-4 py-3 font-medium">Owner</th><th className="px-4 py-3 font-medium">Mobile</th><th className="px-4 py-3 font-medium">GST</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium">Actions</th></tr></thead><tbody>{vendors.length ? vendors.map((vendor) => <tr key={vendor.id} className="border-b last:border-b-0"><td className="px-4 py-4 font-mono text-xs">{vendor.vendorCode}</td><td className="px-4 py-4">{vendor.companyName}</td><td className="px-4 py-4">{vendor.ownerName}</td><td className="px-4 py-4">{vendor.mobile}</td><td className="px-4 py-4">{vendor.gstNumber || "—"}</td><td className="px-4 py-4">{vendor.vendorType}</td><td className="px-4 py-4">{vendor.status}</td><td className="px-4 py-4">{hasPermission(session, "VENDOR_EDIT") ? <Link href={`/dashboard/vendors/${vendor.id}/edit`} className="text-sm underline underline-offset-4">Edit</Link> : <span className="text-muted-foreground">No actions</span>}</td></tr>) : <tr><td className="px-4 py-8 text-muted-foreground" colSpan={8}>No vendors found.</td></tr>}</tbody></table></div></div></main>;
}

