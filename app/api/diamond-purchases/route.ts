import { NextResponse } from "next/server";
import { createDiamondPurchase, type PurchaseStatus } from "@/lib/admin-inventory";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PURCHASE_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createDiamondPurchase({
      vendorId: String(formData.get("vendorId") ?? ""),
      invoiceNo: String(formData.get("invoiceNo") ?? ""),
      invoiceDate: String(formData.get("invoiceDate") ?? ""),
      purchaseDate: String(formData.get("purchaseDate") ?? ""),
      items: JSON.parse(String(formData.get("items") ?? "[]")),
      gst: String(formData.get("gst") ?? "0"),
      otherCharges: String(formData.get("otherCharges") ?? "0"),
      remarks: String(formData.get("remarks") ?? ""),
      status: String(formData.get("status") ?? "DRAFT") as PurchaseStatus,
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create diamond purchase." }, { status: 400 });
  }
}
