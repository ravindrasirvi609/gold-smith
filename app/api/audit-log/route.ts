import { NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || !hasPermission(session, "AUDIT_VIEW")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  const logs = await getAuditLogs();
  return NextResponse.json({ ok: true, logs });
}

