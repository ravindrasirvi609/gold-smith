import { NextResponse } from "next/server";
import { deletePermission, updatePermission } from "@/lib/admin-permissions";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();

    await updatePermission(id, {
      module: String(formData.get("module") ?? ""),
      action: String(formData.get("action") ?? ""),
      code: String(formData.get("code") ?? ""),
      description: String(formData.get("description") ?? ""),
      isActive: String(formData.get("isActive") ?? "true") === "true",
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update permission.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !hasPermission(session, "PERMISSION_DELETE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deletePermission(id);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete permission.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
