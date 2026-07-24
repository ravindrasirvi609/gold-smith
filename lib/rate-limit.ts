import { getDb } from "@/lib/mongodb";

/**
 * MongoDB-backed sliding-window rate limiter.
 *
 * A single collection (`rateLimits`) stores one document per (key, windowStart)
 * combination with an incrementing `count`. A TTL index on `expiresAt` cleans
 * up old windows automatically.
 *
 * This works across serverless instances (Vercel) because state lives in
 * MongoDB rather than in-process memory.
 */
export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

export async function rateLimit(input: {
  key: string; // unique identifier: "login:email:ip" etc.
  limit: number; // max attempts per window
  windowSeconds: number; // window duration
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = input;
  const now = new Date();
  const windowMs = windowSeconds * 1000;
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const resetAt = new Date(windowStart.getTime() + windowMs);

  const db = await getDb();
  const collection = db.collection("rateLimits");

  const result = await collection.findOneAndUpdate(
    { key, windowStart },
    {
      $inc: { count: 1 },
      $setOnInsert: {
        key,
        windowStart,
        expiresAt: new Date(resetAt.getTime() + 60_000), // small buffer past reset
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  const count = Number(result?.count ?? 1);
  const remaining = Math.max(0, limit - count);
  const allowed = count <= limit;

  return { allowed, remaining, resetAt };
}

/**
 * Ensures the TTL index exists on the rateLimits collection.
 * Called once at startup by ensureIndexes.
 */
export async function ensureRateLimitIndexes() {
  const db = await getDb();
  await db.collection("rateLimits").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "expiresAt_ttl" }
  );
  await db.collection("rateLimits").createIndex(
    { key: 1, windowStart: 1 },
    { unique: true, name: "key_window_unique" }
  );
}
