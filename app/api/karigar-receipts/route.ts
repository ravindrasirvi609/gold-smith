import { NextResponse } from "next/server";
import { createReceipt, type ReceiptStatus } from "@/lib/admin-manufacturing";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createReceipt({
      issueId: String(formData.get("issueId") ?? ""),
      receiveDate: String(formData.get("receiveDate") ?? ""),
      labourCharge: String(formData.get("labourCharge") ?? "0"),
      labourType: String(formData.get("labourType") ?? ""),
      jewellery: JSON.parse(String(formData.get("jewellery") ?? "[]")),
      status: String(formData.get("status") ?? "PENDING") as ReceiptStatus,
      signedReceiptUrl: String(formData.get("signedReceiptUrl") ?? ""),
      productImageUrl: String(formData.get("productImageUrl") ?? ""),
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create receipt." }, { status: 400 });
  }
}
