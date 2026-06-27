import { NextResponse } from "next/server";
import { upsertSetting } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_EDIT")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const body = await request.json();
    const result = await upsertSetting({ key: String(body.key ?? ""), value: body.value, description: String(body.description ?? "") }, session.userId);
    return NextResponse.json({ ok: true, id: result.key });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to update setting." }, { status: 400 });
  }
}

