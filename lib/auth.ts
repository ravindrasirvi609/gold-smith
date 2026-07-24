import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";

export const authCookieName = "goldsmith_session";
const sessionTtlMs = 1000 * 60 * 60 * 24 * 30;
const jwtSecret = process.env.JWT_SECRET;

function getJwtSecret() {
  if (!jwtSecret) {
    throw new Error("Missing JWT_SECRET environment variable.");
  }

  return jwtSecret;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function createToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function signJwt(payload: Record<string, unknown>) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "30d" });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, getJwtSecret()) as {
    sub: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { id: string; name: string };
    permissions: string[];
    sessionId: string;
  };
}

export type AuthSession = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; name: string };
  permissions: string[];
};

export async function createSessionRecord(input: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: { id: string; name: string };
  permissions: string[];
}) {
  const db = await getDb();
  const now = new Date();
  const sessionId = createToken();
  const sessionHash = hashToken(sessionId);
  const token = signJwt({
    sub: input.userId,
    email: input.email,
    firstName: input.firstName,
    lastName: input.lastName,
    role: input.role,
    permissions: input.permissions,
    sessionId,
  });

  await db.collection("sessions").insertOne({
    userId: input.userId,
    sessionHash,
    expiresAt: new Date(now.getTime() + sessionTtlMs),
    createdAt: now,
  });

  return { token };
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(authCookieName)?.value;

  if (!sessionToken) {
    return null;
  }

  let payload;

  try {
    payload = verifyJwt(sessionToken);
  } catch {
    return null;
  }

  const db = await getDb();
  const sessionHash = hashToken(payload.sessionId);
  const now = new Date();
  const session = await db.collection("sessions").findOne({
    sessionHash,
    expiresAt: { $gt: now },
  });

  if (!session) {
    return null;
  }

  return {
    userId: payload.sub,
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    role: payload.role,
    permissions: payload.permissions,
  } satisfies AuthSession;
}

export function hasPermission(
  session: AuthSession | null,
  permission: string
) {
  return Boolean(session?.permissions.includes(permission));
}

/**
 * Return every live session for a user. Uses the `sessions` collection —
 * caller supplies the userId string exactly as we store it (String(_id)).
 */
export async function listUserSessions(userId: string) {
  const db = await getDb();
  const now = new Date();
  const rows = await db
    .collection("sessions")
    .find({ userId, expiresAt: { $gt: now } })
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((row) => ({
    id: String(row._id),
    createdAt: row.createdAt
      ? new Date(row.createdAt as string).toISOString()
      : "",
    expiresAt: row.expiresAt
      ? new Date(row.expiresAt as string).toISOString()
      : "",
  }));
}

/**
 * Revoke a specific session by its Mongo _id. The next request carrying
 * that JWT will fail the `sessions` lookup and be treated as logged-out.
 */
export async function revokeSession(sessionId: string) {
  const { ObjectId } = await import("mongodb");
  if (!ObjectId.isValid(sessionId)) throw new Error("Invalid session id.");
  const db = await getDb();
  await db.collection("sessions").deleteOne({ _id: new ObjectId(sessionId) });
}

/**
 * Invalidate every live session for a user. Used for admin force-logout.
 */
export async function revokeAllSessionsForUser(userId: string) {
  const db = await getDb();
  const result = await db.collection("sessions").deleteMany({ userId });
  return { count: result.deletedCount };
}
