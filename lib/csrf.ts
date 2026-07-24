import crypto from "node:crypto";
import { cookies } from "next/headers";

/**
 * Double-submit-cookie CSRF protection.
 *
 * On any authenticated page render we ensure the client has a `csrf_token`
 * cookie with a random value. Every state-changing request must echo that
 * value back via an `x-csrf-token` header (or `csrf_token` form field).
 * We compare the two values in constant time. Since attacker origins cannot
 * read the cookie value, they cannot forge the header.
 *
 * The cookie is NOT httpOnly — the client-side form pattern must be able to
 * read it. Because it is only used for CSRF validation (never for
 * authentication), this is safe. All actual auth state remains in the
 * separate httpOnly session cookie.
 */

export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";
export const CSRF_FIELD = "csrf_token";

function newToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Shared cookie settings for issuing the readable CSRF token cookie.
 */
export function getCsrfCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

/**
 * Generate a new CSRF token value and the cookie options needed to persist it.
 * Cookie writes must happen in a Route Handler or Server Action.
 */
export function createCsrfCookie() {
  return {
    token: newToken(),
    options: getCsrfCookieOptions(),
  };
}

/**
 * Read the current CSRF token from the cookie (returns "" if missing).
 */
export async function getCsrfToken(): Promise<string> {
  const jar = await cookies();
  return jar.get(CSRF_COOKIE)?.value ?? "";
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Verify a request's CSRF token. Returns true if valid.
 *
 * Reads the expected value from the `csrf_token` cookie and compares it
 * against the `x-csrf-token` header. For form submissions that cannot easily
 * set a header, callers may pass an explicit `formToken` extracted from the
 * request body.
 */
export async function verifyCsrf(
  request: Request,
  formToken?: string
): Promise<boolean> {
  const jar = await cookies();
  const cookieToken = jar.get(CSRF_COOKIE)?.value ?? "";
  const headerToken = request.headers.get(CSRF_HEADER) ?? "";
  const provided = headerToken || formToken || "";
  return safeEqual(cookieToken, provided);
}
