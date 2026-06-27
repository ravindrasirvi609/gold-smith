import { NextResponse } from "next/server";
import { deleteGoldPurchase, updateGoldPurchase, type PurchaseStatus } from "@/lib/admin-inventory";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_EDIT")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params; const formData = await request.formData();
    await updateGoldPurchase(id, { vendorId: String(formData.get("vendorId") ?? ""), invoiceNo: String(formData.get("invoiceNo") ?? ""), invoiceDate: String(formData.get("invoiceDate") ?? ""), purchaseDate: String(formData.get("purchaseDate") ?? ""), items: JSON.parse(String(formData.get("items") ?? "[]")), gst: String(formData.get("gst") ?? "0"), otherCharges: String(formData.get("otherCharges") ?? "0"), remarks: String(formData.get("remarks") ?? ""), status: String(formData.get("status") ?? "DRAFT") as PurchaseStatus }, session.userId);
    return NextResponse.json({ ok: true, id });
  } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to update gold purchase." }, { status: 400 }); }
}
export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_DELETE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try { const { id } = await params; await deleteGoldPurchase(id); return NextResponse.json({ ok: true, id }); } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to delete gold purchase." }, { status: 400 }); }
}
