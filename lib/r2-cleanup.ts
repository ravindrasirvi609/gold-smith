import { deleteFromR2 } from "@/lib/r2";

/**
 * Extract the R2 object key from a public URL. Returns null if the URL
 * doesn't belong to our configured R2 public host, which prevents us from
 * accidentally issuing a DELETE against a foreign hostname.
 */
export function extractR2Key(url: string): string | null {
  if (!url) return null;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  if (!publicUrl) return null;
  try {
    const parsed = new URL(url);
    const base = new URL(publicUrl);
    if (parsed.host !== base.host) return null;
    const key = parsed.pathname.replace(/^\/+/, "");
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Delete every URL that belongs to R2, ignoring anything else.
 * All failures are logged and swallowed — orphaned R2 objects are a
 * cleanup problem, never a reason to fail an entity-delete operation.
 */
export async function deleteR2Objects(urls: Array<string | null | undefined>) {
  const keys = urls
    .map((u) => (u ? extractR2Key(u) : null))
    .filter((k): k is string => Boolean(k));
  if (!keys.length) return;
  await Promise.all(
    keys.map(async (key) => {
      try {
        await deleteFromR2(key);
      } catch (err) {
        console.error("[r2-cleanup] deleteFromR2 failed", { key, err });
      }
    })
  );
}
