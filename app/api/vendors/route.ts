import { NextResponse } from "next/server";
import { createVendor } from "@/lib/admin-vendors";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_CREATE"))
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createVendor({
      vendorType: String(formData.get("vendorType") ?? "GOLD") as "GOLD" | "DIAMOND" | "BOTH",
      companyName: String(formData.get("companyName") ?? ""),
      ownerName: String(formData.get("ownerName") ?? ""),
      mobile: String(formData.get("mobile") ?? ""),
      alternateMobile: String(formData.get("alternateMobile") ?? ""),
      email: String(formData.get("email") ?? ""),
      gstNumber: String(formData.get("gstNumber") ?? ""),
      panNumber: String(formData.get("panNumber") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      pincode: String(formData.get("pincode") ?? ""),
      country: String(formData.get("country") ?? "IN"),
      openingBalance: String(formData.get("openingBalance") ?? "0"),
      creditDays: String(formData.get("creditDays") ?? "0"),
      remarks: String(formData.get("remarks") ?? ""),
      status: String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "BLOCKED",
      businessType: String(formData.get("businessType") ?? ""),
      website: String(formData.get("website") ?? ""),
      paymentTerms: String(formData.get("paymentTerms") ?? ""),
      creditLimit: String(formData.get("creditLimit") ?? "0"),
      bankName: String(formData.get("bankName") ?? ""),
      ifscCode: String(formData.get("ifscCode") ?? ""),
      accountNumber: String(formData.get("accountNumber") ?? ""),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      gstDocUrl: String(formData.get("gstDocUrl") ?? ""),
      panDocUrl: String(formData.get("panDocUrl") ?? ""),
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to create vendor." },
      { status: 400 }
    );
  }
}
