import { notFound, redirect } from "next/navigation";
import { PurchaseForm } from "@/components/inventory/purchase-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getDiamondPurchaseById } from "@/lib/admin-inventory";
import { getVendorOptions } from "@/lib/admin-vendor-options";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditDiamondPurchasePage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_EDIT")) redirect("/dashboard/diamond-purchases");
  const { id } = await params;
  const [purchase, vendors] = await Promise.all([getDiamondPurchaseById(id), getVendorOptions(["DIAMOND", "BOTH"])]);
  if (!purchase) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="w-full"><PurchaseForm mode="edit" actionUrl={`/api/diamond-purchases/${id}`} purchaseType="diamond" vendors={vendors} initialValues={purchase} canDelete={hasPermission(session, "PURCHASE_DELETE")} /></div></div></main>;
}

