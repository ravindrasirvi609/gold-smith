import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/admin-dashboard";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  try {
    const data = await getDashboardData();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Unable to load dashboard." },
      { status: 500 }
    );
  }
}
