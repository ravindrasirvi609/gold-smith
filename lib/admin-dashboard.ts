import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/mongodb";

function s(value: unknown) {
  return String(value ?? "");
}

function n(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export type DashboardPayload = {
  kpis: {
    goldStockKg: number;
    diamondStockCarats: number;
    totalProducts: number;
    todaySales: number;
    todayPurchase: number;
    todayProfit: number;
    pendingOrders: number;
    pendingApproval: number;
    pendingPayments: number;
    activeKarigars: number;
    customers: number;
    vendors: number;
  };
  charts: {
    salesVsPurchase: { label: string; sales: number; purchases: number }[];
    inventoryMix: { label: string; value: number }[];
    approvalsByStatus: { label: string; value: number }[];
  };
  inventory: {
    gold: { currentStock: number; totalIn: number; totalOut: number };
    diamond: { currentPcs: number; currentCarat: number; totalPcsIn: number; totalPcsOut: number; totalCaratIn: number; totalCaratOut: number };
  };
  summaries: {
    customerSummary: { active: number; blocked: number; total: number };
    vendorSummary: { active: number; blocked: number; total: number };
    karigarSummary: { active: number; busy: number; total: number };
  };
  alerts: { title: string; message: string; severity: "info" | "warning" | "critical" }[];
  timeline: { time: string; title: string; description: string; kind: string }[];
  performers: {
    customers: { label: string; value: number }[];
    vendors: { label: string; value: number }[];
    karigars: { label: string; value: number }[];
  };
  goldRate: { ratePerGram: number; updatedAt: string; source: string };
  quickStats: { label: string; value: string }[];
};

async function getGoldMetrics() {
  const db = await getDb();
  const [summary, latest] = await Promise.all([
    db.collection("goldInventoryLedger").aggregate([{ $group: { _id: null, totalIn: { $sum: "$inWeight" }, totalOut: { $sum: "$outWeight" } } }]).toArray(),
    db.collection("goldInventoryLedger").find({}).sort({ transactionDate: -1, createdAt: -1 }).limit(1).toArray(),
  ]);

  return {
    summary: {
      totalIn: n(summary[0]?.totalIn ?? 0),
      totalOut: n(summary[0]?.totalOut ?? 0),
      currentStock: n(latest[0]?.balanceAfterTransaction ?? 0),
    },
  };
}

/**
 * Cached wrapper. The dashboard's 16 parallel queries are expensive; we
 * cache the aggregated payload for 60 seconds. That's short enough that
 * users see near-real-time data (invoices land within a minute of being
 * created) but long enough that dashboard hits from multiple team members
 * collapse into a single DB round-trip.
 *
 * Callers that need fresh data can invoke `revalidateTag("dashboard")` from
 * their mutating route handler.
 */
export const getDashboardData = unstable_cache(
  () => _getDashboardDataUncached(),
  ["dashboard-payload"],
  { revalidate: 60, tags: ["dashboard"] }
);

async function _getDashboardDataUncached(): Promise<DashboardPayload> {
  const db = await getDb();
  const now = new Date();
  const todayStart = startOfDay(now);
  const sevenDays = Array.from({ length: 7 }, (_, index) => addDays(todayStart, index - 6));

  const diamondSummaryPromise = db
    .collection("diamondInventoryLedger")
    .aggregate([{ $group: { _id: null, totalPcsIn: { $sum: "$pcsIn" }, totalPcsOut: { $sum: "$pcsOut" }, totalCaratIn: { $sum: "$caratIn" }, totalCaratOut: { $sum: "$caratOut" } } }])
    .toArray() as Promise<{ totalPcsIn: number; totalPcsOut: number; totalCaratIn: number; totalCaratOut: number }[]>;
  const diamondLatestPromise = db.collection("diamondInventoryLedger").find({}).sort({ transactionDate: -1, createdAt: -1 }).limit(1).toArray() as Promise<{ balancePcs?: number; balanceCarat?: number }[]>;
  const customerDocsPromise = db.collection("customers").find({}).toArray() as Promise<{ _id: unknown; status?: string; firstName?: string; lastName?: string }[]>;
  const vendorDocsPromise = db.collection("vendors").find({}).toArray() as Promise<{ _id: unknown; status?: string; companyName?: string; ownerName?: string }[]>;
  const karigarDocsPromise = db.collection("karigars").find({}).toArray() as Promise<{ _id: unknown; status?: string; name?: string }[]>;

  const [
    goldData,
    diamondSummary,
    diamondLatest,
    productsCount,
    customerDocs,
    vendorDocs,
    karigars,
    approvals,
    invoices,
    payments,
    goldPurchases,
    diamondPurchases,
    settings,
    auditLogs,
    issues,
    receipts,
  ] = await Promise.all([
    getGoldMetrics(),
    diamondSummaryPromise,
    diamondLatestPromise,
    db.collection("products").countDocuments({}),
    customerDocsPromise,
    vendorDocsPromise,
    karigarDocsPromise,
    db.collection("approvals").aggregate([{ $sort: { createdAt: -1 } }]).toArray(),
    db.collection("invoices").aggregate([{ $sort: { createdAt: -1 } }]).toArray(),
    db.collection("payments").aggregate([{ $sort: { createdAt: -1 } }]).toArray(),
    db.collection("goldPurchases").aggregate([{ $sort: { createdAt: -1 } }]).toArray(),
    db.collection("diamondPurchases").aggregate([{ $sort: { createdAt: -1 } }]).toArray(),
    db.collection("settings").find({}).sort({ key: 1 }).toArray(),
    db.collection("auditLogs").aggregate([{ $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userDoc" } }, { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } }, { $sort: { createdAt: -1 } }, { $limit: 20 }]).toArray(),
    db.collection("karigarIssues").aggregate([{ $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } }, { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } }, { $sort: { createdAt: -1 } }, { $limit: 20 }]).toArray(),
    db.collection("karigarReceipts").aggregate([{ $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } }, { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } }, { $sort: { createdAt: -1 } }, { $limit: 20 }]).toArray(),
  ]);

  const customerList = customerDocs;
  const vendorList = vendorDocs;
  const karigarList = karigars;

  const invoiceByDay = new Map<string, number>();
  const purchaseByDay = new Map<string, number>();
  for (const day of sevenDays) {
    const key = day.toISOString().slice(0, 10);
    invoiceByDay.set(key, 0);
    purchaseByDay.set(key, 0);
  }

  for (const invoice of invoices) {
    const key = String(invoice.invoiceDate ?? invoice.createdAt ?? "").slice(0, 10);
    if (invoiceByDay.has(key)) invoiceByDay.set(key, invoiceByDay.get(key)! + n(invoice.grandTotal));
  }
  for (const purchase of [...goldPurchases, ...diamondPurchases]) {
    const key = String(purchase.purchaseDate ?? purchase.createdAt ?? "").slice(0, 10);
    if (purchaseByDay.has(key)) purchaseByDay.set(key, purchaseByDay.get(key)! + n(purchase.total));
  }

  const salesVsPurchase = sevenDays.map((day) => {
    const key = day.toISOString().slice(0, 10);
    return { label: formatDay(day), sales: invoiceByDay.get(key) ?? 0, purchases: purchaseByDay.get(key) ?? 0 };
  });

  const approvalsByStatus = approvals.reduce<Record<string, number>>((acc, approval) => {
    const key = s(approval.status ?? "DRAFT");
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const activeKarigars = karigarList.filter((karigar) => s(karigar.status ?? "ACTIVE") === "ACTIVE").length;
  const blockedCustomers = customerList.filter((customer) => s(customer.status ?? "ACTIVE") === "BLOCKED").length;
  const blockedVendors = vendorList.filter((vendor) => s(vendor.status ?? "ACTIVE") === "BLOCKED").length;
  const pendingOrders = approvals.filter((approval) => ["ISSUED", "PARTIALLY_RETURNED"].includes(s(approval.status))).length;
  const pendingApproval = approvals.filter((approval) => s(approval.status) === "DRAFT").length;
  const pendingPayments = payments.filter((payment) => ["PENDING", "PARTIAL"].includes(s(payment.status))).reduce((sum, payment) => sum + n(payment.amount), 0);
  const todayProfit = invoices
    .filter((invoice) => String(invoice.invoiceDate ?? invoice.createdAt ?? "").slice(0, 10) === todayStart.toISOString().slice(0, 10))
    .reduce((sum, invoice) => sum + n(invoice.grandTotal), 0)
    - [...goldPurchases, ...diamondPurchases]
      .filter((purchase) => String(purchase.purchaseDate ?? purchase.createdAt ?? "").slice(0, 10) === todayStart.toISOString().slice(0, 10))
      .reduce((sum, purchase) => sum + n(purchase.total), 0);

  const goldRateSetting = settings.find((setting) => ["GOLD_RATE", "goldRate", "gold_rate"].includes(s(setting.key)));
  const rateValue = n(goldRateSetting?.value?.ratePerGram ?? goldRateSetting?.value ?? 0);

  const alerts = [
    pendingApproval > 0 ? { title: "Approvals pending", message: `${pendingApproval} approvals need review.`, severity: "warning" as const } : null,
    pendingPayments > 0 ? { title: "Payments outstanding", message: `₹${pendingPayments.toLocaleString("en-IN")} is still pending.`, severity: "critical" as const } : null,
    activeKarigars < 5 ? { title: "Karigar capacity low", message: "Karigar workforce is below the desired floor.", severity: "warning" as const } : null,
    !rateValue ? { title: "Gold rate not configured", message: "Set a gold rate setting to populate the widget.", severity: "info" as const } : null,
  ].filter(Boolean) as DashboardPayload["alerts"];

  const timeline = [
    ...auditLogs.slice(0, 6).map((entry) => ({
      time: new Date(entry.createdAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      title: `${s(entry.module)} · ${s(entry.action)}`,
      description: s(entry.description ?? ""),
      kind: "audit",
    })),
    ...receipts.slice(0, 4).map((receipt) => ({
      time: s(receipt.receiveDate ?? ""),
      title: `Receipt ${s(receipt.receiptNo ?? "")}`,
      description: `Karigar ${s(receipt.karigarDoc?.name ?? "")} marked ${s(receipt.status ?? "")}.`,
      kind: "receipt",
    })),
    ...issues.slice(0, 4).map((issue) => ({
      time: s(issue.issueDate ?? ""),
      title: `Issue ${s(issue.issueNo ?? "")}`,
      description: `Assigned to ${s(issue.karigarDoc?.name ?? "")}.`,
      kind: "issue",
    })),
  ].slice(0, 10);

  const topCustomers = invoices.reduce<Map<string, number>>((acc, invoice) => {
    const customer = s(invoice.customerId ?? "");
    if (!customer) return acc;
    acc.set(customer, (acc.get(customer) ?? 0) + n(invoice.grandTotal));
    return acc;
  }, new Map());

  const topVendors = [...goldPurchases, ...diamondPurchases].reduce<Map<string, number>>((acc, purchase) => {
    const vendor = s(purchase.vendorId ?? "");
    if (!vendor) return acc;
    acc.set(vendor, (acc.get(vendor) ?? 0) + n(purchase.total));
    return acc;
  }, new Map());

  const topKarigars = issues.reduce<Map<string, number>>((acc, issue) => {
    const karigar = s(issue.karigarId ?? "");
    if (!karigar) return acc;
    acc.set(karigar, (acc.get(karigar) ?? 0) + 1);
    return acc;
  }, new Map());

  const customerMap = new Map(customerList.map((customer) => [s(customer._id), customer]));
  const vendorMap = new Map(vendorList.map((vendor) => [s(vendor._id), vendor]));
  const karigarMap = new Map(karigarList.map((karigar) => [s(karigar._id), karigar]));

  return {
    kpis: {
      goldStockKg: n(goldData.summary.currentStock),
      diamondStockCarats: n(diamondLatest[0]?.balanceCarat ?? 0),
      totalProducts: productsCount,
      todaySales: invoices.filter((invoice) => String(invoice.invoiceDate ?? invoice.createdAt ?? "").slice(0, 10) === todayStart.toISOString().slice(0, 10)).reduce((sum, invoice) => sum + n(invoice.grandTotal), 0),
      todayPurchase: [...goldPurchases, ...diamondPurchases].filter((purchase) => String(purchase.purchaseDate ?? purchase.createdAt ?? "").slice(0, 10) === todayStart.toISOString().slice(0, 10)).reduce((sum, purchase) => sum + n(purchase.total), 0),
      todayProfit,
      pendingOrders,
      pendingApproval,
      pendingPayments,
      activeKarigars,
      customers: customerList.length,
      vendors: vendorList.length,
    },
    charts: {
      salesVsPurchase,
      inventoryMix: [
        { label: "Gold", value: n(goldData.summary.currentStock) },
        { label: "Diamond", value: n(diamondLatest[0]?.balanceCarat ?? 0) },
        { label: "Products", value: productsCount },
      ],
      approvalsByStatus: Object.entries(approvalsByStatus).map(([label, value]) => ({ label, value })),
    },
    inventory: {
      gold: { currentStock: n(goldData.summary.currentStock), totalIn: n(goldData.summary.totalIn), totalOut: n(goldData.summary.totalOut) },
      diamond: { currentPcs: n(diamondLatest[0]?.balancePcs ?? 0), currentCarat: n(diamondLatest[0]?.balanceCarat ?? 0), totalPcsIn: n(diamondSummary[0]?.totalPcsIn ?? 0), totalPcsOut: n(diamondSummary[0]?.totalPcsOut ?? 0), totalCaratIn: n(diamondSummary[0]?.totalCaratIn ?? 0), totalCaratOut: n(diamondSummary[0]?.totalCaratOut ?? 0) },
    },
    summaries: {
      customerSummary: { active: customerList.length - blockedCustomers, blocked: blockedCustomers, total: customerList.length },
      vendorSummary: { active: vendorList.length - blockedVendors, blocked: blockedVendors, total: vendorList.length },
      karigarSummary: { active: activeKarigars, busy: pendingOrders, total: karigarList.length },
    },
    alerts,
    timeline,
    performers: {
      customers: [...topCustomers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, value]) => ({ label: `${s(customerMap.get(id)?.firstName ?? "")} ${s(customerMap.get(id)?.lastName ?? "")}`.trim() || "Unknown", value })),
      vendors: [...topVendors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, value]) => ({ label: s(vendorMap.get(id)?.companyName ?? vendorMap.get(id)?.ownerName ?? "Unknown"), value })),
      karigars: [...topKarigars.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, value]) => ({ label: s(karigarMap.get(id)?.name ?? "Unknown"), value })),
    },
    goldRate: {
      ratePerGram: rateValue,
      updatedAt: s(goldRateSetting?.updatedAt ?? goldRateSetting?.createdAt ?? ""),
      source: s(goldRateSetting?.description ?? "Settings"),
    },
    quickStats: [
      { label: "Open approvals", value: String(pendingApproval) },
      { label: "Pending payments", value: `₹${pendingPayments.toLocaleString("en-IN")}` },
      { label: "Active karigars", value: String(activeKarigars) },
      { label: "Gold stock", value: `${n(goldData.summary.currentStock).toFixed(3)} KG` },
    ],
  };
}
