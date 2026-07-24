export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadToR2, R2_MAX_BYTES, ALLOWED_DOC_MIMES } from "@/lib/r2";
import {
  makeObjectKey,
  VALID_KINDS,
  type UploadKind,
  type UploadedFile,
} from "@/lib/uploads";
import { sanitizeFileName, verifyMagicBytes } from "@/lib/file-security";
import {
  getClientIp,
  getUserAgent,
  logSecurityEvent,
} from "@/lib/security-events";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const ip = getClientIp(request);
  const userAgent = getUserAgent(request);

  // 30 uploads per minute per user. Prevents accidental or abusive floods.
  const limit = await rateLimit({
    key: `upload:user:${session.userId}`,
    limit: 30,
    windowSeconds: 60,
  });
  if (!limit.allowed) {
    await logSecurityEvent({
      type: "RATE_LIMITED",
      email: session.email,
      userId: session.userId,
      ip,
      userAgent,
      path: "/api/uploads",
    });
    return NextResponse.json(
      { ok: false, message: "Too many uploads. Please slow down." },
      { status: 429 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { ok: false, message: "No file provided." },
        { status: 400 }
      );
    }
    if (!VALID_KINDS.has(kind)) {
      return NextResponse.json(
        { ok: false, message: "Invalid upload kind." },
        { status: 400 }
      );
    }

    const mime = file.type;
    if (!ALLOWED_DOC_MIMES.has(mime)) {
      await logSecurityEvent({
        type: "UPLOAD_REJECTED",
        email: session.email,
        userId: session.userId,
        ip,
        userAgent,
        path: "/api/uploads",
        metadata: { reason: "BAD_MIME", mime },
      });
      return NextResponse.json(
        {
          ok: false,
          message: `File type "${mime}" is not allowed. Use JPG, PNG, WEBP, GIF, SVG or PDF.`,
        },
        { status: 415 }
      );
    }
    if (file.size > R2_MAX_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          message: `File exceeds the ${R2_MAX_BYTES / 1024 / 1024} MB limit.`,
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Verify the file content actually matches the declared MIME type.
    // A malicious payload could otherwise upload an executable as image/jpeg.
    if (!verifyMagicBytes(buffer, mime)) {
      await logSecurityEvent({
        type: "UPLOAD_REJECTED",
        email: session.email,
        userId: session.userId,
        ip,
        userAgent,
        path: "/api/uploads",
        metadata: {
          reason: "MAGIC_MISMATCH",
          mime,
          fileName: sanitizeFileName(file.name),
        },
      });
      return NextResponse.json(
        {
          ok: false,
          message:
            "File content does not match the declared type. Upload rejected.",
        },
        { status: 415 }
      );
    }

    const safeName = sanitizeFileName(file.name);
    const key = makeObjectKey(kind as UploadKind, mime);
    const url = await uploadToR2(buffer, key, mime);

    const uploaded: UploadedFile = {
      url,
      key,
      name: safeName,
      size: file.size,
      mime,
    };
    return NextResponse.json({ ok: true, file: uploaded });
  } catch (err) {
    console.error("[uploads] error", err);
    return NextResponse.json(
      { ok: false, message: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
