import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { updateUser } from "@/lib/admin-users";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !hasPermission(session, "USER_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();

    await updateUser(id, {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      email: String(formData.get("email") ?? ""),
      mobile: String(formData.get("mobile") ?? ""),
      password: String(formData.get("password") ?? ""),
      roleId: String(formData.get("roleId") ?? ""),
      status: (String(formData.get("status") ?? "ACTIVE") as "ACTIVE" | "INACTIVE" | "BLOCKED"),
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update user.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
