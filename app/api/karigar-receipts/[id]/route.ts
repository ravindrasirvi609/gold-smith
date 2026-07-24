import { NextResponse } from "next/server";
import {
  deleteReceipt,
  updateReceipt,
  type ReceiptStatus,
} from "@/lib/admin-manufacturing";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const formData = await request.formData();
    await updateReceipt(
      id,
      {
        receiveDate: String(formData.get("receiveDate") ?? ""),
        labourCharge: String(formData.get("labourCharge") ?? "0"),
        labourType: String(formData.get("labourType") ?? ""),
        jewellery: JSON.parse(String(formData.get("jewellery") ?? "[]")),
        status: String(formData.get("status") ?? "PENDING") as ReceiptStatus,
        signedReceiptUrl: String(formData.get("signedReceiptUrl") ?? ""),
        productImageUrl: String(formData.get("productImageUrl") ?? ""),
      },
      session.userId
    );
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to update receipt.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_DELETE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deleteReceipt(id);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to delete receipt.",
      },
      { status: 400 }
    );
  }
}
