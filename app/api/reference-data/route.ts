import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import {
  createReferenceRow,
  listReferenceRows,
} from "@/lib/admin-reference-data";
import type { EditableKind } from "@/lib/reference-data";

const VALID_KINDS: EditableKind[] = [
  "jewellery-subcategory",
  "karigar-specialization",
  "sale-type",
  "approval-purpose",
];

function isValidKind(value: unknown): value is EditableKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value);
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, message: "Not authenticated." }, { status: 401 });
  }
  const kind = new URL(request.url).searchParams.get("kind");
  const kindFilter = kind && isValidKind(kind) ? kind : undefined;
  const rows = await listReferenceRows(kindFilter);
  return NextResponse.json({ ok: true, rows });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "SETTINGS_EDIT")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  try {
    const formData = await request.formData();
    const kind = String(formData.get("kind") ?? "");
    if (!isValidKind(kind)) {
      return NextResponse.json(
        { ok: false, message: "Invalid kind." },
        { status: 400 }
      );
    }
    const row = await createReferenceRow({
      kind,
      value: String(formData.get("value") ?? ""),
      label: String(formData.get("label") ?? ""),
      parent: String(formData.get("parent") ?? ""),
      hint: String(formData.get("hint") ?? ""),
    });
    return NextResponse.json({ ok: true, row });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to save option.",
      },
      { status: 400 }
    );
  }
}
