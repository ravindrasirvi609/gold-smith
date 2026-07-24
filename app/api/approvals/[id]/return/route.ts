import { NextResponse } from "next/server";
import { returnApprovalProducts } from "@/lib/admin-sales";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const { id } = await params;
    const formData = await request.formData();
    const rawIds = formData.getAll("productId").map((v) => String(v));
    const productIds = rawIds.filter((v) => v.length > 0);
    const result = await returnApprovalProducts(id, productIds, session.userId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to return products.",
      },
      { status: 400 }
    );
  }
}
