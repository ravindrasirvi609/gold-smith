/**
 * Client-side helpers for authenticated form submissions.
 *
 * `apiFetch()` behaves like fetch(...) but automatically:
 *   - reads the CSRF cookie set by the server on dashboard render
 *   - attaches it as an x-csrf-token header
 *   - includes credentials by default so the session cookie flows
 *
 * All state-changing forms in the dashboard should use this helper instead
 * of raw fetch. Existing fetch(...) callers continue to work — CSRF
 * enforcement is opt-in per route via the guardRequest helper.
 */

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const prefix = `${name}=`;
  return (
    document.cookie
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith(prefix))
      ?.slice(prefix.length) ?? ""
  );
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const csrf = readCookie("csrf_token");
  const headers = new Headers(init.headers);
  if (csrf) headers.set("x-csrf-token", csrf);

  return fetch(input, {
    credentials: "same-origin",
    ...init,
    headers,
  });
}
