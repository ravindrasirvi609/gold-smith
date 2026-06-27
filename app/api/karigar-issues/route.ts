import { NextResponse } from "next/server";
import { createIssue, type IssueStatus } from "@/lib/admin-manufacturing";
import { getSession, hasPermission } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "ISSUE_CREATE")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  try {
    const formData = await request.formData();
    const result = await createIssue({
      karigarId: String(formData.get("karigarId") ?? ""),
      issueDate: String(formData.get("issueDate") ?? ""),
      designReference: String(formData.get("designReference") ?? ""),
      expectedDeliveryDate: String(formData.get("expectedDeliveryDate") ?? ""),
      gold: JSON.parse(String(formData.get("gold") ?? "[]")),
      diamonds: JSON.parse(String(formData.get("diamonds") ?? "[]")),
      notes: String(formData.get("notes") ?? ""),
      status: String(formData.get("status") ?? "DRAFT") as IssueStatus,
    }, session.userId);
    return NextResponse.json({ ok: true, id: result.id });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error instanceof Error ? error.message : "Unable to create issue." }, { status: 400 });
  }
}
