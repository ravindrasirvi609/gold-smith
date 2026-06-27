import { NextResponse } from "next/server";
import { createApproval } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createApproval({
      customerId: String(formData.get("customerId") ?? ""),
      issueDate: String(formData.get("issueDate") ?? ""),
      expectedReturnDate: String(formData.get("expectedReturnDate") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      remarks: String(formData.get("remarks") ?? ""),
      status: "ISSUED",
      products: JSON.parse(String(formData.get("products") ?? "[]")),
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create approval." }, { status: 400 });
  }
}

