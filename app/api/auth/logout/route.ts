import { NextResponse } from "next/server";
import { authCookieName, getSession, hashToken, verifyJwt } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import {
  getClientIp,
  getUserAgent,
  logSecurityEvent,
} from "@/lib/security-events";

export async function POST(request: Request) {
  // Best-effort: invalidate the session record server-side so the token
  // cannot be replayed even before its natural expiry.
  const session = await getSession().catch(() => null);
  const cookieToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${authCookieName}=`))
    ?.split("=")[1];

  if (cookieToken) {
    try {
      const payload = verifyJwt(cookieToken);
      const db = await getDb();
      await db
        .collection("sessions")
        .deleteOne({ sessionHash: hashToken(payload.sessionId) });
    } catch {
      // token invalid — nothing to invalidate
    }
  }

  if (session) {
    await logSecurityEvent({
      type: "LOGOUT",
      email: session.email,
      userId: session.userId,
      ip: getClientIp(request),
      userAgent: getUserAgent(request),
      path: "/api/auth/logout",
    });
  }

  const response = NextResponse.redirect(new URL("/login", request.url));
  response.cookies.set(authCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
