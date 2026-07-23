import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { createUser } from "@/lib/admin-users";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_CREATE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const result = await createUser(
      {
        firstName: String(formData.get("firstName") ?? ""),
        lastName: String(formData.get("lastName") ?? ""),
        email: String(formData.get("email") ?? ""),
        mobile: String(formData.get("mobile") ?? ""),
        password: String(formData.get("password") ?? ""),
        roleId: String(formData.get("roleId") ?? ""),
        status: (String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "BLOCKED"),
        profileImage: String(formData.get("profileImage") ?? ""),
      },
      session.userId
    );

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create user.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
