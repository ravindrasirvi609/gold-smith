import { NextResponse } from "next/server";
import { createPayment, type PaymentType } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createPayment({
      invoiceId: String(formData.get("invoiceId") ?? ""),
      customerId: String(formData.get("customerId") ?? ""),
      paymentDate: String(formData.get("paymentDate") ?? ""),
      paymentType: String(formData.get("paymentType") ?? "Cash") as PaymentType,
      transactionId: String(formData.get("transactionId") ?? ""),
      referenceNumber: String(formData.get("referenceNumber") ?? ""),
      bankName: String(formData.get("bankName") ?? ""),
      amount: String(formData.get("amount") ?? "0"),
      remarks: String(formData.get("remarks") ?? ""),
      status: "PENDING",
      attachmentUrl: String(formData.get("attachmentUrl") ?? ""),
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create payment." }, { status: 400 });
  }
}
