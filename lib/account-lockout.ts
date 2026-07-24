import { getDb } from "@/lib/mongodb";

/**
 * Account lockout state stored per user.
 *
 * After MAX_FAILURES failed logins within FAILURE_WINDOW_MS, the account is
 * locked for LOCKOUT_MS. A successful login clears the counter.
 */

export const MAX_FAILURES = 5;
export const FAILURE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes

export type LockoutStatus =
  | { locked: false }
  | { locked: true; unlocksAt: Date };

export async function isAccountLocked(email: string): Promise<LockoutStatus> {
  const db = await getDb();
  const record = await db
    .collection("loginAttempts")
    .findOne({ email });

  if (!record) return { locked: false };

  const lockedUntil = record.lockedUntil ? new Date(record.lockedUntil) : null;
  if (lockedUntil && lockedUntil.getTime() > Date.now()) {
    return { locked: true, unlocksAt: lockedUntil };
  }
  return { locked: false };
}

export async function recordFailedLogin(email: string): Promise<LockoutStatus> {
  const db = await getDb();
  const now = new Date();
  const record = await db.collection("loginAttempts").findOne({ email });

  const firstFailureAt =
    record?.firstFailureAt &&
    now.getTime() - new Date(record.firstFailureAt).getTime() < FAILURE_WINDOW_MS
      ? new Date(record.firstFailureAt)
      : now;

  const previousFailures =
    record?.firstFailureAt &&
    now.getTime() - new Date(record.firstFailureAt).getTime() < FAILURE_WINDOW_MS
      ? Number(record.failures ?? 0)
      : 0;

  const failures = previousFailures + 1;
  const shouldLock = failures >= MAX_FAILURES;
  const lockedUntil = shouldLock ? new Date(now.getTime() + LOCKOUT_MS) : null;

  await db.collection("loginAttempts").updateOne(
    { email },
    {
      $set: {
        email,
        failures,
        firstFailureAt,
        lastFailureAt: now,
        lockedUntil,
      },
    },
    { upsert: true }
  );

  return lockedUntil
    ? { locked: true, unlocksAt: lockedUntil }
    : { locked: false };
}

export async function clearFailedLogins(email: string): Promise<void> {
  const db = await getDb();
  await db.collection("loginAttempts").deleteOne({ email });
}
