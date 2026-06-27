import { notFound, redirect } from "next/navigation";
import { PurchaseForm } from "@/components/inventory/purchase-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getGoldPurchaseById } from "@/lib/admin-inventory";
import { getVendorOptions } from "@/lib/admin-vendor-options";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditGoldPurchasePage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_EDIT")) redirect("/dashboard/gold-purchases");
  const { id } = await params;
  const [purchase, vendors] = await Promise.all([getGoldPurchaseById(id), getVendorOptions(["GOLD", "BOTH"])]);
  if (!purchase) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="w-full"><PurchaseForm mode="edit" actionUrl={`/api/gold-purchases/${id}`} purchaseType="gold" vendors={vendors} initialValues={purchase} canDelete={hasPermission(session, "PURCHASE_DELETE")} /></div></div></main>;
}

