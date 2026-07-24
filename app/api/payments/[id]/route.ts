import { NextResponse } from "next/server";
import { deletePayment } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_DELETE")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    await deletePayment(id, session.userId);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Unable to delete payment.",
      },
      { status: 400 }
    );
  }
}
