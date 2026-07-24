import { NextResponse } from "next/server";
import { getSession, hasPermission, revokeAllSessionsForUser } from "@/lib/auth";
import { logSecurityEvent, getClientIp, getUserAgent } from "@/lib/security-events";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/users/[id]/force-logout
 *
 * Admin action: invalidate every live session for a user. Requires the
 * USER_EDIT permission. The user's next request will fail the session
 * lookup and be redirected to /login.
 */
export async function POST(request: Request, { params }: RouteParams) {
  const session = await getSession();
  if (!session || !hasPermission(session, "USER_EDIT")) {
    return NextResponse.json(
      { ok: false, message: "Forbidden" },
      { status: 403 }
    );
  }
  try {
    const { id } = await params;
    const { count } = await revokeAllSessionsForUser(id);
    await logSecurityEvent({
      type: "SESSION_INVALIDATED",
      userId: id,
      email: session.email,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
      path: `/api/users/${id}/force-logout`,
      metadata: { forcedBy: session.userId, sessionsRevoked: count },
    });
    return NextResponse.json({ ok: true, sessionsRevoked: count });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error ? error.message : "Unable to force logout.",
      },
      { status: 400 }
    );
  }
}
