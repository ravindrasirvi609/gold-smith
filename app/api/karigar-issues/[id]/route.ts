import { NextResponse } from "next/server";
import { deleteIssue, updateIssue, type IssueStatus } from "@/lib/admin-manufacturing";
import { getSession, hasPermission } from "@/lib/auth";

type RouteParams = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_EDIT")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const { id } = await params;
    const formData = await request.formData();
    await updateIssue(id, {
      karigarId: String(formData.get("karigarId") ?? ""),
      issueDate: String(formData.get("issueDate") ?? ""),
      designReference: String(formData.get("designReference") ?? ""),
      expectedDeliveryDate: String(formData.get("expectedDeliveryDate") ?? ""),
      gold: JSON.parse(String(formData.get("gold") ?? "[]")),
      diamonds: JSON.parse(String(formData.get("diamonds") ?? "[]")),
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "DRAFT") as IssueStatus,
      challanUrl: String(formData.get("challanUrl") ?? ""),
    }, session.userId);
    return NextResponse.json({ ok: true, id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to update issue." }, { status: 400 });
  }
}
export async function DELETE(_: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_DELETE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try { const { id } = await params; await deleteIssue(id); return NextResponse.json({ ok: true, id }); } catch (error) { return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to delete issue." }, { status: 400 }); }
}
