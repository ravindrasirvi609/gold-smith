import { NextResponse } from "next/server";
import { createPermission } from "@/lib/admin-permissions";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_CREATE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const formData = await request.formData();

    const result = await createPermission({
      module: String(formData.get("module") ?? ""),
      action: String(formData.get("action") ?? ""),
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: String(formData.get("isActive") ?? "true") === "true",
    });

    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create permission.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
