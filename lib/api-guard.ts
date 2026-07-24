import { NextResponse } from "next/server";
import { getSession, hasPermission, type AuthSession } from "@/lib/auth";
import { CSRF_FIELD, verifyCsrf } from "@/lib/csrf";
import {
  getClientIp,
  getUserAgent,
  logSecurityEvent,
} from "@/lib/security-events";

/**
 * Composable guard for state-changing API routes.
 *
 * Usage:
 *   export async function POST(req: Request) {
 *     const guard = await guardRequest(req, {
 *       permission: "VENDOR_CREATE",
 *       requireCsrf: true,
 *     });
 *     if (!guard.ok) return guard.response;
 *     const { session, formData } = guard;
 *     // ...business logic
 *   }
 */
export type GuardResult =
  | {
      ok: true;
      session: AuthSession;
      formData: FormData;
    }
  | {
      ok: false;
      response: NextResponse;
    };

export async function guardRequest(
  request: Request,
  opts: { permission?: string; requireCsrf?: boolean } = {}
): Promise<GuardResult> {
  const session = await getSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "Not authenticated." },
        { status: 401 }
      ),
    };
  }

  if (opts.permission && !hasPermission(session, opts.permission)) {
    await logSecurityEvent({
      type: "PERMISSION_DENIED",
      email: session.email,
      userId: session.userId,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
      path: new URL(request.url).pathname,
      metadata: { permission: opts.permission },
    });
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, message: "You do not have permission for this action." },
        { status: 403 }
      ),
    };
  }

  // We need formData to check the fallback CSRF field. Read it once here
  // and hand it back to the caller so they don't re-consume the stream.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    // Not a form submission (JSON body). Recreate an empty FormData for the
    // consumer; they will read the body themselves.
    formData = new FormData();
  }

  if (opts.requireCsrf !== false) {
    const formToken = String(formData.get(CSRF_FIELD) ?? "");
    const valid = await verifyCsrf(request, formToken);
    if (!valid) {
      await logSecurityEvent({
        type: "CSRF_FAILURE",
        email: session.email,
        userId: session.userId,
        ip: getClientIp(request),
        userAgent: getUserAgent(request),
        path: new URL(request.url).pathname,
      });
      return {
        ok: false,
        response: NextResponse.json(
          {
            ok: false,
            message: "Session expired. Please refresh the page and try again.",
          },
          { status: 403 }
        ),
      };
    }
  }

  return { ok: true, session, formData };
}
