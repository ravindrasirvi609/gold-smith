import { NextResponse } from "next/server";
import { createKarigar } from "@/lib/admin-karigars";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "KARIGAR_CREATE"))
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createKarigar({
      name: String(formData.get("name") ?? ""),
      fatherName: String(formData.get("fatherName") ?? ""),
      mobile: String(formData.get("mobile") ?? ""),
      alternateMobile: String(formData.get("alternateMobile") ?? ""),
      email: String(formData.get("email") ?? ""),
      aadhaar: String(formData.get("aadhaar") ?? ""),
      pan: String(formData.get("pan") ?? ""),
      gst: String(formData.get("gst") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      pincode: String(formData.get("pincode") ?? ""),
      country: String(formData.get("country") ?? "IN"),
      specialization: String(formData.get("specialization") ?? ""),
      labourType: String(formData.get("labourType") ?? "PER_GRAM") as "PER_GRAM" | "PER_PIECE" | "FIXED",
      labourRate: String(formData.get("labourRate") ?? ""),
      openingBalance: String(formData.get("openingBalance") ?? "0"),
      creditBalance: String(formData.get("creditBalance") ?? "0"),
      joiningDate: String(formData.get("joiningDate") ?? ""),
      remarks: String(formData.get("remarks") ?? ""),
      status: String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "BLOCKED",
      gender: String(formData.get("gender") ?? ""),
      skillLevel: String(formData.get("skillLevel") ?? ""),
      photoUrl: String(formData.get("photoUrl") ?? ""),
      aadhaarDocUrl: String(formData.get("aadhaarDocUrl") ?? ""),
      panDocUrl: String(formData.get("panDocUrl") ?? ""),
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to create karigar." },
      { status: 400 }
    );
  }
}
