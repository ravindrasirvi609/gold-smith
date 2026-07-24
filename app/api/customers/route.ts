import { NextResponse } from "next/server";
import { createCustomer } from "@/lib/admin-customers";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_CREATE"))
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createCustomer({
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      gender: String(formData.get("gender") ?? ""),
      dob: String(formData.get("dob") ?? ""),
      anniversary: String(formData.get("anniversary") ?? ""),
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
      remarks: String(formData.get("remarks") ?? ""),
      status: String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "BLOCKED",
      salutation: String(formData.get("salutation") ?? ""),
      maritalStatus: String(formData.get("maritalStatus") ?? ""),
      customerTier: String(formData.get("customerTier") ?? ""),
      preferredContactChannel: String(formData.get("preferredContactChannel") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? ""),
      idProofUrl: String(formData.get("idProofUrl") ?? ""),
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to create customer." },
      { status: 400 }
    );
  }
}
