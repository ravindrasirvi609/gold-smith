import type { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { unstable_cache } from "next/cache";

/**
 * Analytics and reports.
 *
 * The getReportsData() function is aggregate-heavy — it walks invoices,
 * payments, products, and both ledgers. The results are cached with a
 * short TTL so the reports page stays snappy even on large datasets.
 */

type RangeKey = "last_7" | "last_30" | "last_90" | "ytd" | "all";

const RANGE_DAYS: Record<Exclude<RangeKey, "ytd" | "all">, number> = {
  last_7: 7,
  last_30: 30,
  last_90: 90,
};

function s(value: unknown) {
  return String(value ?? "");
}

function n(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function since(range: RangeKey): Date | null {
  if (range === "all") return null;
  if (range === "ytd") {
    const now = new Date();
    return new Date(now.getFullYear(), 0, 1);
  }
  const days = RANGE_DAYS[range] ?? 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export type ReportsData = {
  range: RangeKey;
  totals: {
    invoicesCount: number;
    revenue: string;
    paymentsCount: number;
    collected: string;
    averageInvoice: string;
    outstanding: string;
  };
  topCustomers: Array<{ name: string; total: string; count: number }>;
  topProducts: Array<{ jewelCode: string; count: number }>;
  aging: Array<{ bucket: string; count: number; total: string }>;
  inventory: {
    goldGrams: string;
    diamondCarats: string;
    availableProducts: number;
  };
};

async function _getReportsData(range: RangeKey): Promise<ReportsData> {
  const db = await getDb();
  const from = since(range);

  const invoiceFilter: Record<string, unknown> = {
    paymentStatus: { $ne: "CANCELLED" },
  };
  const paymentFilter: Record<string, unknown> = {
    status: { $nin: ["REFUNDED", "CANCELLED"] },
  };
  if (from) {
    invoiceFilter.createdAt = { $gte: from };
    paymentFilter.createdAt = { $gte: from };
  }

  const [invoices, payments, goldLedger, diamondLedger, availableProducts] =
    await Promise.all([
      db.collection("invoices").find(invoiceFilter).toArray(),
      db.collection("payments").find(paymentFilter).toArray(),
      db
        .collection("goldInventoryLedger")
        .aggregate([
          {
            $group: {
              _id: null,
              inTotal: { $sum: "$inWeight" },
              outTotal: { $sum: "$outWeight" },
            },
          },
        ])
        .toArray(),
      db
        .collection("diamondInventoryLedger")
        .aggregate([
          {
            $group: {
              _id: null,
              caratIn: { $sum: "$caratIn" },
              caratOut: { $sum: "$caratOut" },
            },
          },
        ])
        .toArray(),
      db.collection("products").countDocuments({ status: "AVAILABLE" }),
    ]);

  const revenue = invoices.reduce((sum, inv) => sum + n(inv.grandTotal), 0);
  const collected = payments.reduce((sum, p) => sum + n(p.amount), 0);
  const invoicesCount = invoices.length;
  const paymentsCount = payments.length;
  const outstanding = Math.max(0, revenue - collected);
  const averageInvoice = invoicesCount ? revenue / invoicesCount : 0;

  // Top customers by revenue in this range.
  const customerTotals = new Map<
    string,
    { total: number; count: number; name: string }
  >();
  const customerIds = invoices
    .map((inv) => inv.customerId as ObjectId | undefined)
    .filter((v): v is ObjectId => Boolean(v));
  const customers = customerIds.length
    ? await db
        .collection("customers")
        .find({ _id: { $in: customerIds } })
        .toArray()
    : [];
  const nameByCustomer = new Map<string, string>(
    customers.map((c) => [
      String(c._id),
      `${s(c.firstName)} ${s(c.lastName)}`.trim() || s(c.customerCode),
    ])
  );
  for (const inv of invoices) {
    const key = String(inv.customerId ?? "");
    if (!key) continue;
    const existing = customerTotals.get(key) ?? {
      total: 0,
      count: 0,
      name: nameByCustomer.get(key) || "Unknown",
    };
    existing.total += n(inv.grandTotal);
    existing.count += 1;
    customerTotals.set(key, existing);
  }
  const topCustomers = Array.from(customerTotals.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((row) => ({
      name: row.name,
      total: row.total.toFixed(2),
      count: row.count,
    }));

  // Top products by sales count.
  const productCounts = new Map<string, number>();
  for (const inv of invoices) {
    if (!Array.isArray(inv.products)) continue;
    for (const row of inv.products as Array<{ jewelCode?: string }>) {
      const code = String(row.jewelCode ?? "");
      if (!code) continue;
      productCounts.set(code, (productCounts.get(code) ?? 0) + 1);
    }
  }
  const topProducts = Array.from(productCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([jewelCode, count]) => ({ jewelCode, count }));

  // Aging buckets on unpaid invoices (independent of the selected range).
  const unpaidInvoices = await db
    .collection("invoices")
    .find({
      paymentStatus: { $in: ["PENDING_PAYMENT", "PARTIALLY_PAID"] },
    })
    .toArray();
  const now = Date.now();
  const buckets = [
    { bucket: "0-30 days", count: 0, total: 0 },
    { bucket: "31-60 days", count: 0, total: 0 },
    { bucket: "61-90 days", count: 0, total: 0 },
    { bucket: "90+ days", count: 0, total: 0 },
  ];
  for (const inv of unpaidInvoices) {
    const created = inv.createdAt
      ? new Date(inv.createdAt as string).getTime()
      : now;
    const age = Math.floor((now - created) / (1000 * 60 * 60 * 24));
    const idx = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3;
    buckets[idx].count += 1;
    buckets[idx].total += n(inv.grandTotal);
  }
  const aging = buckets.map((b) => ({
    bucket: b.bucket,
    count: b.count,
    total: b.total.toFixed(2),
  }));

  const goldGrams = n(goldLedger[0]?.inTotal) - n(goldLedger[0]?.outTotal);
  const diamondCarats =
    n(diamondLedger[0]?.caratIn) - n(diamondLedger[0]?.caratOut);

  return {
    range,
    totals: {
      invoicesCount,
      paymentsCount,
      revenue: revenue.toFixed(2),
      collected: collected.toFixed(2),
      averageInvoice: averageInvoice.toFixed(2),
      outstanding: outstanding.toFixed(2),
    },
    topCustomers,
    topProducts,
    aging,
    inventory: {
      goldGrams: goldGrams.toFixed(2),
      diamondCarats: diamondCarats.toFixed(2),
      availableProducts: availableProducts,
    },
  };
}

export const getReportsData = unstable_cache(
  (range: RangeKey) => _getReportsData(range),
  ["reports-data"],
  { revalidate: 120, tags: ["reports"] }
);

export const RANGE_LABELS: Record<RangeKey, string> = {
  last_7: "Last 7 days",
  last_30: "Last 30 days",
  last_90: "Last 90 days",
  ytd: "Year to date",
  all: "All time",
};

export type { RangeKey };
