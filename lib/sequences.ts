import { getDb } from "@/lib/mongodb";

/**
 * Atomic monotonic counters stored in the `sequences` collection.
 *
 * Each sequence is one document: `{ _id: "vendor", value: <number> }`. The
 * counter is incremented atomically with `findOneAndUpdate({ $inc })`, so
 * concurrent writers can never receive the same number.
 *
 * Sequences seed themselves from the highest existing code the first time
 * they are used, so migrating from the old sort-based generator is safe.
 */

export type SequenceName =
  | "vendor"
  | "customer"
  | "karigar"
  | "goldPurchase"
  | "diamondPurchase"
  | "karigarIssue"
  | "karigarReceipt"
  | "product"
  | "approval"
  | "invoice"
  | "payment";

type SeedFn = () => Promise<number>;

const seeds: Record<SequenceName, SeedFn> = {
  vendor: () => seedFromField("vendors", "vendorCode", /^V(\d+)/),
  customer: () => seedFromField("customers", "customerCode", /^C(\d+)/),
  karigar: () => seedFromField("karigars", "karigarCode", /^K(\d+)/),
  goldPurchase: () => seedFromField("goldPurchases", "purchaseNo", /^GP(\d+)/),
  diamondPurchase: () =>
    seedFromField("diamondPurchases", "purchaseNo", /^DP(\d+)/),
  karigarIssue: () => seedFromField("karigarIssues", "issueNo", /^KI(\d+)/),
  karigarReceipt: () => seedFromField("karigarReceipts", "receiptNo", /^KR(\d+)/),
  product: () => seedFromField("products", "jewelCode", /^JC(\d+)/),
  approval: () => seedFromField("approvals", "approvalNo", /^APP-?(\d+)/),
  invoice: () => seedFromField("invoices", "invoiceNo", /^INV-?(\d+)/),
  payment: () => seedFromField("payments", "paymentNo", /^PAY-?(\d+)/),
};

async function seedFromField(
  collection: string,
  field: string,
  pattern: RegExp
): Promise<number> {
  const db = await getDb();
  const doc = await db
    .collection(collection)
    .find({}, { projection: { [field]: 1 } })
    .sort({ [field]: -1 })
    .limit(1)
    .toArray();

  if (!doc.length) return 0;
  const value = String(doc[0]?.[field] ?? "");
  const match = pattern.exec(value);
  return match ? parseInt(match[1] ?? "0", 10) : 0;
}

/**
 * Return the next integer for a sequence. Atomic, safe under concurrency.
 */
export async function nextSequence(name: SequenceName): Promise<number> {
  const db = await getDb();
  const collection = db.collection<{ _id: string; value: number }>("sequences");

  // Ensure the counter exists and is at least as high as any legacy code.
  const existing = await collection.findOne({ _id: name });
  if (!existing) {
    const seed = await seeds[name]();
    await collection.updateOne(
      { _id: name },
      { $setOnInsert: { value: seed } },
      { upsert: true }
    );
  }

  const result = await collection.findOneAndUpdate(
    { _id: name },
    { $inc: { value: 1 } },
    { returnDocument: "after", upsert: true }
  );

  return Number(result?.value ?? 1);
}

/** Format a code like "V0001" from a numeric sequence. */
export function formatCode(prefix: string, n: number, pad = 4): string {
  return `${prefix}${String(n).padStart(pad, "0")}`;
}

/** Format a dashed code like "INV-00001". */
export function formatDashedCode(prefix: string, n: number, pad = 5): string {
  return `${prefix}-${String(n).padStart(pad, "0")}`;
}
