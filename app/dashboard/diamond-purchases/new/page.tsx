import { redirect } from "next/navigation";
import { PurchaseForm } from "@/components/inventory/purchase-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getVendorOptions } from "@/lib/admin-vendor-options";

export default async function NewDiamondPurchasePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_CREATE")) redirect("/dashboard/diamond-purchases");
  const vendors = await getVendorOptions(["DIAMOND", "BOTH"]);
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="w-full"><PurchaseForm mode="create" actionUrl="/api/diamond-purchases" purchaseType="diamond" vendors={vendors} /></div></div></main>;
}

