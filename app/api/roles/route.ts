import { NextResponse } from "next/server";
import { createRole } from "@/lib/admin-roles";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_CREATE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const permissionIds = formData.getAll("permissionIds").map((value) => String(value));

    const result = await createRole({
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      permissionIds,
      isActive: String(formData.get("isActive") ?? "true") === "true",
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create role.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
