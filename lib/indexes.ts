import { getDb } from "@/lib/mongodb";

/**
 * Ensure all required MongoDB indexes exist. Idempotent — safe to call
 * repeatedly. Runs once per process on first call via ensureIndexesOnce().
 *
 * TTL indexes are used for:
 *   - sessions.expiresAt         (auto-clean expired sessions)
 *   - rateLimits.expiresAt       (auto-clean rate-limit windows)
 *   - loginAttempts.lockedUntil  (NOT TTL — must persist for the lock window)
 *
 * Unique indexes prevent duplicate codes even if the sequence generator
 * fails or is bypassed.
 */

let ensurePromise: Promise<void> | null = null;

export async function ensureIndexesOnce(): Promise<void> {
  if (ensurePromise) return ensurePromise;
  ensurePromise = doEnsureIndexes().catch((err) => {
    ensurePromise = null; // let the next call retry
    throw err;
  });
  return ensurePromise;
}

async function doEnsureIndexes(): Promise<void> {
  const db = await getDb();

  await Promise.all([
    // Sessions — TTL auto-clean on expiry
    db.collection("sessions").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "expiresAt_ttl" }
    ),
    db.collection("sessions").createIndex(
      { sessionHash: 1 },
      { unique: true, name: "sessionHash_unique" }
    ),

    // Users — case-insensitive unique email
    db.collection("users").createIndex(
      { email: 1 },
      {
        unique: true,
        collation: { locale: "en", strength: 2 },
        name: "email_unique_ci",
      }
    ),

    // Roles / Permissions
    db.collection("permissions").createIndex(
      { code: 1 },
      { unique: true, name: "code_unique" }
    ),
    db.collection("roles").createIndex(
      { name: 1 },
      { unique: true, name: "name_unique" }
    ),

    // Vendors / Customers / Karigars
    db.collection("vendors").createIndex(
      { vendorCode: 1 },
      { unique: true, name: "vendorCode_unique" }
    ),
    db.collection("customers").createIndex(
      { customerCode: 1 },
      { unique: true, name: "customerCode_unique" }
    ),
    db.collection("karigars").createIndex(
      { karigarCode: 1 },
      { unique: true, name: "karigarCode_unique" }
    ),

    // Purchases
    db.collection("goldPurchases").createIndex(
      { purchaseNo: 1 },
      { unique: true, name: "purchaseNo_unique" }
    ),
    db.collection("diamondPurchases").createIndex(
      { purchaseNo: 1 },
      { unique: true, name: "purchaseNo_unique" }
    ),

    // Manufacturing
    db.collection("karigarIssues").createIndex(
      { issueNo: 1 },
      { unique: true, name: "issueNo_unique" }
    ),
    db.collection("karigarReceipts").createIndex(
      { receiptNo: 1 },
      { unique: true, name: "receiptNo_unique" }
    ),
    db.collection("products").createIndex(
      { jewelCode: 1 },
      { unique: true, name: "jewelCode_unique" }
    ),

    // Sales
    db.collection("approvals").createIndex(
      { approvalNo: 1 },
      { unique: true, name: "approvalNo_unique" }
    ),
    db.collection("invoices").createIndex(
      { invoiceNo: 1 },
      { unique: true, name: "invoiceNo_unique" }
    ),
    db.collection("payments").createIndex(
      { paymentNo: 1 },
      { unique: true, name: "paymentNo_unique" }
    ),

    // Ledgers — query performance
    db.collection("goldInventoryLedger").createIndex(
      { transactionDate: -1 },
      { name: "transactionDate_desc" }
    ),
    db.collection("goldInventoryLedger").createIndex(
      { referenceId: 1, referenceType: 1 },
      { name: "reference" }
    ),
    db.collection("diamondInventoryLedger").createIndex(
      { transactionDate: -1 },
      { name: "transactionDate_desc" }
    ),
    db.collection("diamondInventoryLedger").createIndex(
      { referenceId: 1, referenceType: 1 },
      { name: "reference" }
    ),

    // Product history
    db.collection("productHistory").createIndex(
      { productId: 1, createdAt: -1 },
      { name: "product_time" }
    ),

    // Audit + security logs
    db.collection("auditLogs").createIndex(
      { createdAt: -1 },
      { name: "createdAt_desc" }
    ),
    db.collection("securityEvents").createIndex(
      { createdAt: -1 },
      { name: "createdAt_desc" }
    ),
    db.collection("securityEvents").createIndex(
      { type: 1, createdAt: -1 },
      { name: "type_time" }
    ),

    // Rate limiter (already ensured by ensureRateLimitIndexes but do it here too)
    db.collection("rateLimits").createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0, name: "expiresAt_ttl" }
    ),
    db.collection("rateLimits").createIndex(
      { key: 1, windowStart: 1 },
      { unique: true, name: "key_window_unique" }
    ),

    // Account lockouts
    db.collection("loginAttempts").createIndex(
      { email: 1 },
      { unique: true, name: "email_unique" }
    ),

    // Sequences
    db.collection("sequences").createIndex({ _id: 1 }, { name: "id" }),
  ]);
}
