import type { ClientSession } from "mongodb";
import { getMongoClient } from "@/lib/mongodb";

/**
 * Run a callback inside a MongoDB transaction (replica set only).
 *
 * MongoDB Atlas ships as a replica set and supports transactions
 * out-of-the-box. Local single-node MongoDB does NOT — the driver falls back
 * to a non-transactional execution on receiving a "Transactions are not
 * supported" error so the app still works in dev.
 *
 * Prefer transactions for any operation that mutates more than one
 * collection where partial success would leave the DB inconsistent
 * (invoice creation touching products + history + audit; karigar receipt
 * creating products + updating issue; ledger sync + purchase upsert).
 */
export async function withTransaction<T>(
  work: (session: ClientSession | undefined) => Promise<T>
): Promise<T> {
  const client = await getMongoClient();
  const session = client.startSession();

  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    // Fall back to non-transactional execution when the deployment doesn't
    // support transactions (e.g., local standalone MongoDB).
    const msg = error instanceof Error ? error.message : String(error);
    if (
      /Transaction numbers are only allowed/i.test(msg) ||
      /replica set/i.test(msg) ||
      /IllegalOperation/i.test(msg)
    ) {
      console.warn(
        "[transactions] falling back to non-transactional execution:",
        msg
      );
      return work(undefined);
    }
    throw error;
  } finally {
    await session.endSession();
  }
}
