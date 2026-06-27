import { NextResponse } from "next/server";
import { createInvoice } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createInvoice({
      customerId: String(formData.get("customerId") ?? ""),
      approvalId: String(formData.get("approvalId") ?? ""),
      invoiceDate: String(formData.get("invoiceDate") ?? ""),
      saleType: String(formData.get("saleType") ?? "Direct"),
      remarks: String(formData.get("remarks") ?? ""),
      paymentStatus: "PENDING_PAYMENT",
      products: JSON.parse(String(formData.get("products") ?? "[]")),
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create invoice." }, { status: 400 });
  }
}

