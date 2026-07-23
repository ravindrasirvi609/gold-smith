export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadToR2, R2_MAX_BYTES, ALLOWED_DOC_MIMES } from "@/lib/r2";
import { makeObjectKey, VALID_KINDS, type UploadKind, type UploadedFile } from "@/lib/uploads";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "");

    if (!file || typeof file === "string") {
      return NextResponse.json({ ok: false, message: "No file provided." }, { status: 400 });
    }
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json({ ok: false, message: "Invalid upload kind." }, { status: 400 });
    }

    const mime = file.type;
    if (!ALLOWED_DOC_MIMES.has(mime)) {
      return NextResponse.json(
        { ok: false, message: `File type "${mime}" is not allowed. Use JPG, PNG, WEBP, GIF, SVG or PDF.` },
        { status: 415 }
      );
    }
    if (file.size > R2_MAX_BYTES) {
      return NextResponse.json(
        { ok: false, message: `File exceeds the ${R2_MAX_BYTES / 1024 / 1024} MB limit.` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = makeObjectKey(kind as UploadKind, mime);
    const url = await uploadToR2(buffer, key, mime);

    const uploaded: UploadedFile = { url, key, name: file.name, size: file.size, mime };
    return NextResponse.json({ ok: true, file: uploaded });
  } catch (err) {
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : "Upload failed." },
      { status: 500 }
    );
  }
}
