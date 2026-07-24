import { getDb } from "@/lib/mongodb";

/**
 * Ledger recalculation utility.
 *
 * The ledger entries record incremental `inWeight` / `outWeight` deltas
 * along with a `balanceAfterTransaction` snapshot. That snapshot is only
 * accurate at the moment of insertion — if a past purchase or issue is
 * edited later, downstream snapshots go stale.
 *
 * `recalculateGoldLedger()` walks every gold ledger entry in chronological
 * order and rewrites `balanceAfterTransaction` so it always reflects the
 * true running balance.
 *
 * These helpers are safe to run at any time — they take a global lock (a
 * document in the `ledgerLocks` collection) to prevent two recalculations
 * from stepping on each other.
 */

type LedgerKind = "gold" | "diamond";

const LOCK_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function acquireLock(kind: LedgerKind): Promise<boolean> {
  const db = await getDb();
  const now = new Date();
  const expiry = new Date(now.getTime() + LOCK_TTL_MS);
  try {
    await db.collection("ledgerLocks").insertOne({
      _id: kind as unknown as never,
      acquiredAt: now,
      expiresAt: expiry,
    });
    return true;
  } catch {
    // If lock exists but is expired, take it over.
    const result = await db.collection("ledgerLocks").updateOne(
      { _id: kind as unknown as never, expiresAt: { $lte: now } },
      { $set: { acquiredAt: now, expiresAt: expiry } }
    );
    return result.modifiedCount === 1;
  }
}

async function releaseLock(kind: LedgerKind): Promise<void> {
  const db = await getDb();
  await db.collection("ledgerLocks").deleteOne({ _id: kind as unknown as never });
}

export type LedgerRecalcResult = {
  entriesUpdated: number;
  finalBalance: number;
};

export async function recalculateGoldLedger(): Promise<LedgerRecalcResult> {
  const locked = await acquireLock("gold");
  if (!locked) {
    throw new Error("Another recalculation is already in progress.");
  }

  try {
    const db = await getDb();
    const entries = await db
      .collection("goldInventoryLedger")
      .find({})
      .sort({ transactionDate: 1, createdAt: 1 })
      .toArray();

    let balance = 0;
    let updated = 0;

    for (const entry of entries) {
      const inW = Number(entry.inWeight ?? 0);
      const outW = Number(entry.outWeight ?? 0);
      balance += inW - outW;
      const rounded = Number(balance.toFixed(3));
      if (Number(entry.balanceAfterTransaction ?? NaN) !== rounded) {
        await db
          .collection("goldInventoryLedger")
          .updateOne(
            { _id: entry._id },
            { $set: { balanceAfterTransaction: rounded } }
          );
        updated++;
      }
    }

    return { entriesUpdated: updated, finalBalance: Number(balance.toFixed(3)) };
  } finally {
    await releaseLock("gold");
  }
}

export async function recalculateDiamondLedger(): Promise<LedgerRecalcResult> {
  const locked = await acquireLock("diamond");
  if (!locked) {
    throw new Error("Another recalculation is already in progress.");
  }

  try {
    const db = await getDb();
    const entries = await db
      .collection("diamondInventoryLedger")
      .find({})
      .sort({ transactionDate: 1, createdAt: 1 })
      .toArray();

    let balancePcs = 0;
    let balanceCarat = 0;
    let updated = 0;

    for (const entry of entries) {
      const pcsIn = Number(entry.pcsIn ?? 0);
      const pcsOut = Number(entry.pcsOut ?? 0);
      const cIn = Number(entry.caratIn ?? 0);
      const cOut = Number(entry.caratOut ?? 0);
      balancePcs += pcsIn - pcsOut;
      balanceCarat += cIn - cOut;
      const roundedCarat = Number(balanceCarat.toFixed(3));
      const changed =
        Number(entry.balancePcs ?? NaN) !== balancePcs ||
        Number(entry.balanceCarat ?? NaN) !== roundedCarat;
      if (changed) {
        await db
          .collection("diamondInventoryLedger")
          .updateOne(
            { _id: entry._id },
            {
              $set: {
                balancePcs,
                balanceCarat: roundedCarat,
              },
            }
          );
        updated++;
      }
    }

    return {
      entriesUpdated: updated,
      finalBalance: Number(balanceCarat.toFixed(3)),
    };
  } finally {
    await releaseLock("diamond");
  }
}
