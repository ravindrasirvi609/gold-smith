import { getDb } from "@/lib/mongodb";

export type SecurityEventType =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGIN_LOCKED"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "SESSION_INVALIDATED"
  | "PERMISSION_DENIED"
  | "UPLOAD_REJECTED"
  | "RATE_LIMITED"
  | "CSRF_FAILURE"
  | "SUSPICIOUS_INPUT";

export type SecurityEvent = {
  type: SecurityEventType;
  email?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

export async function logSecurityEvent(event: SecurityEvent) {
  try {
    const db = await getDb();
    await db.collection("securityEvents").insertOne({
      ...event,
      createdAt: new Date(),
    });
  } catch (error) {
    // Never let logging failures break the request.
    console.error("[security-events] failed to log event", error);
  }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function getUserAgent(request: Request): string {
  return request.headers.get("user-agent")?.slice(0, 512) ?? "unknown";
}
