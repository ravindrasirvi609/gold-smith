import { NextResponse } from "next/server";
import { deleteRole, updateRole } from "@/lib/admin-roles";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const formData = await request.formData();
    const permissionIds = formData.getAll("permissionIds").map((value) => String(value));

    await updateRole(id, {
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      permissionIds,
      isActive: String(formData.get("isActive") ?? "true") === "true",
    });

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update role.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await getSession();

  if (!session || !hasPermission(session, "ROLE_DELETE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await deleteRole(id);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete role.";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
