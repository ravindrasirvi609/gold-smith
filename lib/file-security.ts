/**
 * File-security utilities: name sanitization and magic-byte MIME verification.
 *
 * MIME strings from clients cannot be trusted — a `.exe` renamed to `.jpg`
 * will report `image/jpeg` in the `File` API. We inspect the first few bytes
 * of the buffer to confirm the declared type is actually what was uploaded.
 */

const MAGIC_BYTES: Record<string, ReadonlyArray<number>[]> = {
  "image/png": [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  "image/jpeg": [
    [0xff, 0xd8, 0xff, 0xdb],
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
    [0xff, 0xd8, 0xff, 0xe2],
    [0xff, 0xd8, 0xff, 0xe3],
    [0xff, 0xd8, 0xff, 0xe8],
    [0xff, 0xd8, 0xff, 0xee],
  ],
  "image/jpg": [
    [0xff, 0xd8, 0xff, 0xdb],
    [0xff, 0xd8, 0xff, 0xe0],
    [0xff, 0xd8, 0xff, 0xe1],
  ],
  "image/gif": [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  "image/webp": [
    // "RIFF" ??? ??? ??? ??? "WEBP" — check RIFF header + WEBP at offset 8
    [0x52, 0x49, 0x46, 0x46],
  ],
  "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // "%PDF"
  "image/svg+xml": [], // handled separately (text-based)
};

function bytesEqual(buffer: Buffer, signature: ReadonlyArray<number>): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

function looksLikeSvg(buffer: Buffer): boolean {
  const head = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  return head.startsWith("<?xml") || head.startsWith("<svg");
}

function looksLikeWebp(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  return (
    bytesEqual(buffer, [0x52, 0x49, 0x46, 0x46]) &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  );
}

/**
 * Verify that the buffer's magic bytes match the declared MIME type.
 * Returns true if the file content is consistent with the claimed type.
 */
export function verifyMagicBytes(buffer: Buffer, mime: string): boolean {
  if (mime === "image/svg+xml") return looksLikeSvg(buffer);
  if (mime === "image/webp") return looksLikeWebp(buffer);

  const signatures = MAGIC_BYTES[mime];
  if (!signatures) return false;
  return signatures.some((sig) => bytesEqual(buffer, sig));
}

/**
 * Return a safe display name for an uploaded file. Strips path separators,
 * control characters, and truncates to a reasonable length. The returned
 * value is safe to store in Mongo and render in the UI as text (it is not
 * HTML-safe on its own — always render via React text nodes, never
 * dangerouslySetInnerHTML).
 */
export function sanitizeFileName(name: string): string {
  return String(name ?? "")
    .replace(/[\\/]/g, "_")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/^\.+/, "_")
    .trim()
    .slice(0, 200)
    || "file";
}
