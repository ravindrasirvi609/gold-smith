import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import {
  deleteReferenceRow,
  updateReferenceRow,
} from "@/lib/admin-reference-data";

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const formData = await request.formData();
    const row = await updateReferenceRow(id, {
      label: formData.get("label") ? String(formData.get("label")) : undefined,
      parent: formData.get("parent") ? String(formData.get("parent")) : undefined,
      hint: formData.get("hint") ? String(formData.get("hint")) : undefined,
      isActive: formData.get("isActive")
        ? String(formData.get("isActive")) === "true"
        : undefined,
    });
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to update.",
      },
      { status: 400 }
    );
  }
}

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deleteReferenceRow(id);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to delete.",
      },
      { status: 400 }
    );
  }
}
