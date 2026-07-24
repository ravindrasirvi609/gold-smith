import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  andFilters,
  buildSort,
  paginate,
  textSearchFilter,
  type ListQuery,
  type PaginatedResult,
} from "@/lib/list-query";

export type PurchaseStatus = "DRAFT" | "COMPLETED" | "CANCELLED";

export type GoldPurchaseItem = {
  purity: string;
  grossWeight: string;
  pureWeight: string;
  ratePerGram: string;
  amount: string;
};

export type DiamondPurchaseItem = {
  sieveSize: string;
  shape: string;
  color: string;
  clarity: string;
  pcs: string;
  carat: string;
  ratePerCarat: string;
  amount: string;
};

export type GoldPurchaseListItem = {
  id: string;
  purchaseNo: string;
  vendorName: string;
  invoiceNo: string;
  invoiceDate: string;
  purchaseDate: string;
  subtotal: string;
  gst: string;
  total: string;
  status: PurchaseStatus;
  invoiceFileUrl: string;
};

export type DiamondPurchaseListItem = {
  id: string;
  purchaseNo: string;
  vendorName: string;
  invoiceNo: string;
  invoiceDate: string;
  purchaseDate: string;
  subtotal: string;
  gst: string;
  total: string;
  status: PurchaseStatus;
  invoiceFileUrl: string;
};

export type GoldPurchaseFormValues = {
  vendorId: string;
  invoiceNo: string;
  invoiceDate: string;
  purchaseDate: string;
  items: GoldPurchaseItem[];
  gst: string;
  otherCharges: string;
  remarks: string;
  status: PurchaseStatus;
  invoiceFileUrl?: string;
};

export type DiamondPurchaseFormValues = {
  vendorId: string;
  invoiceNo: string;
  invoiceDate: string;
  purchaseDate: string;
  items: DiamondPurchaseItem[];
  gst: string;
  otherCharges: string;
  remarks: string;
  status: PurchaseStatus;
  invoiceFileUrl?: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function asString(value: unknown) {
  return String(value ?? "");
}

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Atomic sequence-based code generator. Replaces the previous find-max
// pattern which was not safe under concurrent writes.
async function nextPurchaseNo(kind: "gold" | "diamond") {
  const { formatCode, nextSequence: seq } = await import("@/lib/sequences");
  const seqName = kind === "gold" ? "goldPurchase" : "diamondPurchase";
  const prefix = kind === "gold" ? "GP" : "DP";
  return formatCode(prefix, await seq(seqName));
}

const PURCHASE_SEARCH_FIELDS = ["purchaseNo", "invoiceNo"];
const PURCHASE_SORT_FIELDS = [
  "createdAt",
  "purchaseNo",
  "purchaseDate",
  "invoiceDate",
  "total",
] as const;

function defaultPurchaseQuery(): ListQuery {
  return {
    page: 1,
    pageSize: 20,
    skip: 0,
    limit: 20,
    search: "",
    sortField: "createdAt",
    sortDir: -1,
    status: "",
    from: "",
    to: "",
  };
}

async function loadPurchases(
  collection: "goldPurchases" | "diamondPurchases",
  query: ListQuery
) {
  const db = await getDb();
  const filter = andFilters(
    textSearchFilter(query.search, PURCHASE_SEARCH_FIELDS),
    query.status ? { status: query.status } : undefined
  );
  const sort = buildSort(
    query.sortField,
    query.sortDir,
    PURCHASE_SORT_FIELDS,
    "createdAt"
  );
  const [total, docs] = await Promise.all([
    db.collection(collection).countDocuments(filter),
    db
      .collection(collection)
      .aggregate([
        { $match: filter },
        {
          $lookup: {
            from: "vendors",
            localField: "vendorId",
            foreignField: "_id",
            as: "vendorDoc",
          },
        },
        { $unwind: { path: "$vendorDoc", preserveNullAndEmptyArrays: true } },
        { $sort: sort as Record<string, 1 | -1> },
        { $skip: query.skip },
        { $limit: query.limit },
      ])
      .toArray(),
  ]);
  return { total, docs };
}

export async function getGoldPurchases(
  query?: ListQuery
): Promise<PaginatedResult<GoldPurchaseListItem>> {
  const q = query ?? defaultPurchaseQuery();
  const { total, docs } = await loadPurchases("goldPurchases", q);
  const items: GoldPurchaseListItem[] = docs.map((purchase) => ({
    id: asString(purchase._id),
    purchaseNo: asString(purchase.purchaseNo ?? ""),
    vendorName: asString(
      purchase.vendorDoc?.companyName ?? purchase.vendorDoc?.ownerName ?? "Unknown"
    ),
    invoiceNo: asString(purchase.invoiceNo ?? ""),
    invoiceDate: asString(purchase.invoiceDate ?? ""),
    purchaseDate: asString(purchase.purchaseDate ?? ""),
    subtotal: asString(purchase.subtotal ?? "0"),
    gst: asString(purchase.gst ?? "0"),
    total: asString(purchase.total ?? "0"),
    status: (purchase.status ?? "DRAFT") as PurchaseStatus,
    invoiceFileUrl: asString(purchase.invoiceFileUrl ?? ""),
  }));
  return paginate(items, total, q);
}

export async function getDiamondPurchases(
  query?: ListQuery
): Promise<PaginatedResult<DiamondPurchaseListItem>> {
  const q = query ?? defaultPurchaseQuery();
  const { total, docs } = await loadPurchases("diamondPurchases", q);
  const items: DiamondPurchaseListItem[] = docs.map((purchase) => ({
    id: asString(purchase._id),
    purchaseNo: asString(purchase.purchaseNo ?? ""),
    vendorName: asString(
      purchase.vendorDoc?.companyName ?? purchase.vendorDoc?.ownerName ?? "Unknown"
    ),
    invoiceNo: asString(purchase.invoiceNo ?? ""),
    invoiceDate: asString(purchase.invoiceDate ?? ""),
    purchaseDate: asString(purchase.purchaseDate ?? ""),
    subtotal: asString(purchase.subtotal ?? "0"),
    gst: asString(purchase.gst ?? "0"),
    total: asString(purchase.total ?? "0"),
    status: (purchase.status ?? "DRAFT") as PurchaseStatus,
    invoiceFileUrl: asString(purchase.invoiceFileUrl ?? ""),
  }));
  return paginate(items, total, q);
}

export async function getGoldPurchaseById(id: string) {
  const db = await getDb();
  const purchase = await db.collection("goldPurchases").findOne({ _id: toObjectId(id) });
  if (!purchase) return null;
  return {
    id: asString(purchase._id),
    vendorId: asString(purchase.vendorId ?? ""),
    invoiceNo: asString(purchase.invoiceNo ?? ""),
    invoiceDate: asString(purchase.invoiceDate ?? ""),
    purchaseDate: asString(purchase.purchaseDate ?? ""),
    items: Array.isArray(purchase.items) ? purchase.items : [],
    gst: asString(purchase.gst ?? "0"),
    otherCharges: asString(purchase.otherCharges ?? "0"),
    remarks: asString(purchase.remarks ?? ""),
    status: (purchase.status ?? "DRAFT") as PurchaseStatus,
    invoiceFileUrl: asString(purchase.invoiceFileUrl ?? ""),
  } satisfies GoldPurchaseFormValues & { id: string };
}

export async function getDiamondPurchaseById(id: string) {
  const db = await getDb();
  const purchase = await db.collection("diamondPurchases").findOne({ _id: toObjectId(id) });
  if (!purchase) return null;
  return {
    id: asString(purchase._id),
    vendorId: asString(purchase.vendorId ?? ""),
    invoiceNo: asString(purchase.invoiceNo ?? ""),
    invoiceDate: asString(purchase.invoiceDate ?? ""),
    purchaseDate: asString(purchase.purchaseDate ?? ""),
    items: Array.isArray(purchase.items) ? purchase.items : [],
    gst: asString(purchase.gst ?? "0"),
    otherCharges: asString(purchase.otherCharges ?? "0"),
    remarks: asString(purchase.remarks ?? ""),
    status: (purchase.status ?? "DRAFT") as PurchaseStatus,
    invoiceFileUrl: asString(purchase.invoiceFileUrl ?? ""),
  } satisfies DiamondPurchaseFormValues & { id: string };
}

async function getVendorIdForPurchase(vendorId: string, allowedTypes: string[]) {
  const db = await getDb();
  if (!ObjectId.isValid(vendorId)) throw new Error("Please select a valid vendor.");
  const vendor = await db.collection("vendors").findOne({ _id: new ObjectId(vendorId), status: "ACTIVE" });
  if (!vendor) throw new Error("Selected vendor does not exist or is inactive.");
  if (!allowedTypes.includes(asString(vendor.vendorType ?? ""))) {
    throw new Error("Selected vendor is not valid for this purchase type.");
  }
  return { vendorId: new ObjectId(vendorId), vendorName: asString(vendor.companyName ?? vendor.ownerName ?? "") };
}

async function syncGoldLedger(purchaseId: ObjectId, purchaseNo: string, items: GoldPurchaseItem[], status: PurchaseStatus, purchaseDate: string, remarks: string, createdBy?: string) {
  const db = await getDb();
  await db.collection("goldInventoryLedger").deleteMany({ referenceType: "GoldPurchase", referenceId: purchaseId });
  if (status !== "COMPLETED") return;
  const lastEntry = await db.collection("goldInventoryLedger").find({}).sort({ createdAt: -1 }).limit(1).toArray();
  let balanceAfter = num(asString(lastEntry[0]?.balanceAfterTransaction ?? "0"));
  const now = new Date();
  const entries = items.map((item) => {
    const inWeight = num(item.pureWeight);
    balanceAfter += inWeight;
    return {
      transactionDate: new Date(purchaseDate || now.toISOString()),
      transactionType: "PURCHASE",
      referenceType: "GoldPurchase",
      referenceId: purchaseId,
      referenceNo: purchaseNo,
      purity: asString(item.purity),
      grossWeight: asString(item.grossWeight),
      pureWeight: asString(item.pureWeight),
      inWeight,
      outWeight: 0,
      balanceAfterTransaction: balanceAfter,
      remarks,
      createdBy: createdBy ? new ObjectId(createdBy) : null,
      createdAt: now,
      updatedAt: now,
    };
  });
  if (entries.length) await db.collection("goldInventoryLedger").insertMany(entries);
}

async function syncDiamondLedger(purchaseId: ObjectId, purchaseNo: string, items: DiamondPurchaseItem[], status: PurchaseStatus, purchaseDate: string, remarks: string, createdBy?: string) {
  const db = await getDb();
  await db.collection("diamondInventoryLedger").deleteMany({ referenceType: "DiamondPurchase", referenceId: purchaseId });
  if (status !== "COMPLETED") return;
  const lastEntry = await db.collection("diamondInventoryLedger").find({}).sort({ createdAt: -1 }).limit(1).toArray();
  let balancePcs = num(asString(lastEntry[0]?.balancePcs ?? "0"));
  let balanceCarat = num(asString(lastEntry[0]?.balanceCarat ?? "0"));
  const now = new Date();
  const entries = items.map((item) => {
    const pcsIn = num(item.pcs);
    const caratIn = num(item.carat);
    balancePcs += pcsIn;
    balanceCarat += caratIn;
    return {
      transactionDate: new Date(purchaseDate || now.toISOString()),
      transactionType: "PURCHASE",
      referenceType: "DiamondPurchase",
      referenceId: purchaseId,
      referenceNo: purchaseNo,
      sieveSize: asString(item.sieveSize),
      shape: asString(item.shape),
      color: asString(item.color),
      clarity: asString(item.clarity),
      pcsIn,
      pcsOut: 0,
      caratIn,
      caratOut: 0,
      balancePcs,
      balanceCarat,
      remarks,
      createdBy: createdBy ? new ObjectId(createdBy) : null,
      createdAt: now,
      updatedAt: now,
    };
  });
  if (entries.length) await db.collection("diamondInventoryLedger").insertMany(entries);
}

export async function createGoldPurchase(input: GoldPurchaseFormValues, createdBy?: string) {
  const db = await getDb();
  const { vendorId } = await getVendorIdForPurchase(input.vendorId, ["GOLD", "BOTH"]);
  const purchaseNo = await nextPurchaseNo("gold");
  const now = new Date();
  const subtotal = input.items.reduce((sum, item) => sum + num(item.amount), 0);
  const total = subtotal + num(input.gst) + num(input.otherCharges);
  const result = await db.collection("goldPurchases").insertOne({
    purchaseNo,
    vendorId,
    invoiceNo: asString(input.invoiceNo).trim(),
    invoiceDate: asString(input.invoiceDate).trim(),
    purchaseDate: asString(input.purchaseDate).trim(),
    items: input.items,
    subtotal: subtotal.toFixed(2),
    gst: asString(input.gst),
    otherCharges: asString(input.otherCharges),
    total: total.toFixed(2),
    paymentStatus: "PENDING",
    remarks: asString(input.remarks),
    status: input.status,
    invoiceFileUrl: asString(input.invoiceFileUrl ?? ""),
    createdBy: createdBy ? new ObjectId(createdBy) : null,
    updatedBy: createdBy ? new ObjectId(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  });
  await syncGoldLedger(result.insertedId, purchaseNo, input.items, input.status, input.purchaseDate, input.remarks, createdBy);
  return { id: String(result.insertedId) };
}

export async function updateGoldPurchase(id: string, input: GoldPurchaseFormValues, updatedBy?: string) {
  const db = await getDb();
  const purchaseId = toObjectId(id);
  const existing = await db.collection("goldPurchases").findOne({ _id: purchaseId });
  if (!existing) throw new Error("Gold purchase not found.");
  const { vendorId } = await getVendorIdForPurchase(input.vendorId, ["GOLD", "BOTH"]);
  const subtotal = input.items.reduce((sum, item) => sum + num(item.amount), 0);
  const total = subtotal + num(input.gst) + num(input.otherCharges);
  await db.collection("goldPurchases").updateOne(
    { _id: purchaseId },
    { $set: { vendorId, invoiceNo: asString(input.invoiceNo).trim(), invoiceDate: asString(input.invoiceDate).trim(), purchaseDate: asString(input.purchaseDate).trim(), items: input.items, subtotal: subtotal.toFixed(2), gst: asString(input.gst), otherCharges: asString(input.otherCharges), total: total.toFixed(2), remarks: asString(input.remarks), status: input.status, invoiceFileUrl: asString(input.invoiceFileUrl ?? ""), updatedBy: updatedBy ? new ObjectId(updatedBy) : null, updatedAt: new Date() } }
  );
  await syncGoldLedger(purchaseId, asString(existing.purchaseNo ?? ""), input.items, input.status, input.purchaseDate, input.remarks, updatedBy);
  return { id };
}

export async function deleteGoldPurchase(id: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const purchaseId = toObjectId(id);
  const existing = await db.collection("goldPurchases").findOne({ _id: purchaseId });
  if (!existing) throw new Error("Gold purchase not found.");
  await db.collection("goldInventoryLedger").deleteMany({ referenceType: "GoldPurchase", referenceId: purchaseId });
  await db.collection("goldPurchases").deleteOne({ _id: purchaseId });
  await deleteR2Objects([existing.invoiceFileUrl as string]);
  return { id };
}

export async function createDiamondPurchase(input: DiamondPurchaseFormValues, createdBy?: string) {
  const db = await getDb();
  const { vendorId } = await getVendorIdForPurchase(input.vendorId, ["DIAMOND", "BOTH"]);
  const purchaseNo = await nextPurchaseNo("diamond");
  const now = new Date();
  const subtotal = input.items.reduce((sum, item) => sum + num(item.amount), 0);
  const total = subtotal + num(input.gst) + num(input.otherCharges);
  const result = await db.collection("diamondPurchases").insertOne({
    purchaseNo,
    vendorId,
    invoiceNo: asString(input.invoiceNo).trim(),
    invoiceDate: asString(input.invoiceDate).trim(),
    purchaseDate: asString(input.purchaseDate).trim(),
    items: input.items,
    subtotal: subtotal.toFixed(2),
    gst: asString(input.gst),
    otherCharges: asString(input.otherCharges),
    total: total.toFixed(2),
    remarks: asString(input.remarks),
    status: input.status,
    invoiceFileUrl: asString(input.invoiceFileUrl ?? ""),
    createdBy: createdBy ? new ObjectId(createdBy) : null,
    updatedBy: createdBy ? new ObjectId(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  });
  await syncDiamondLedger(result.insertedId, purchaseNo, input.items, input.status, input.purchaseDate, input.remarks, createdBy);
  return { id: String(result.insertedId) };
}

export async function updateDiamondPurchase(id: string, input: DiamondPurchaseFormValues, updatedBy?: string) {
  const db = await getDb();
  const purchaseId = toObjectId(id);
  const existing = await db.collection("diamondPurchases").findOne({ _id: purchaseId });
  if (!existing) throw new Error("Diamond purchase not found.");
  const { vendorId } = await getVendorIdForPurchase(input.vendorId, ["DIAMOND", "BOTH"]);
  const subtotal = input.items.reduce((sum, item) => sum + num(item.amount), 0);
  const total = subtotal + num(input.gst) + num(input.otherCharges);
  await db.collection("diamondPurchases").updateOne(
    { _id: purchaseId },
    { $set: { vendorId, invoiceNo: asString(input.invoiceNo).trim(), invoiceDate: asString(input.invoiceDate).trim(), purchaseDate: asString(input.purchaseDate).trim(), items: input.items, subtotal: subtotal.toFixed(2), gst: asString(input.gst), otherCharges: asString(input.otherCharges), total: total.toFixed(2), remarks: asString(input.remarks), status: input.status, invoiceFileUrl: asString(input.invoiceFileUrl ?? ""), updatedBy: updatedBy ? new ObjectId(updatedBy) : null, updatedAt: new Date() } }
  );
  await syncDiamondLedger(purchaseId, asString(existing.purchaseNo ?? ""), input.items, input.status, input.purchaseDate, input.remarks, updatedBy);
  return { id };
}

export async function deleteDiamondPurchase(id: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const purchaseId = toObjectId(id);
  const existing = await db.collection("diamondPurchases").findOne({ _id: purchaseId });
  if (!existing) throw new Error("Diamond purchase not found.");
  await db.collection("diamondInventoryLedger").deleteMany({ referenceType: "DiamondPurchase", referenceId: purchaseId });
  await db.collection("diamondPurchases").deleteOne({ _id: purchaseId });
  await deleteR2Objects([existing.invoiceFileUrl as string]);
  return { id };
}

export async function getGoldInventorySummary() {
  const db = await getDb();
  const totals = await db.collection("goldInventoryLedger").aggregate([{ $group: { _id: null, totalIn: { $sum: "$inWeight" }, totalOut: { $sum: "$outWeight" }, currentStock: { $sum: "$balanceAfterTransaction" } } }]).toArray();
  return totals[0] ?? { totalIn: 0, totalOut: 0, currentStock: 0 };
}

export async function getDiamondInventorySummary() {
  const db = await getDb();
  const totals = await db.collection("diamondInventoryLedger").aggregate([{ $group: { _id: null, totalPcsIn: { $sum: "$pcsIn" }, totalPcsOut: { $sum: "$pcsOut" }, totalCaratIn: { $sum: "$caratIn" }, totalCaratOut: { $sum: "$caratOut" }, currentPcs: { $sum: "$balancePcs" }, currentCarat: { $sum: "$balanceCarat" } } }]).toArray();
  return totals[0] ?? { totalPcsIn: 0, totalPcsOut: 0, totalCaratIn: 0, totalCaratOut: 0, currentPcs: 0, currentCarat: 0 };
}

export async function getGoldLedgerEntries() {
  const db = await getDb();
  return db.collection("goldInventoryLedger").find({}).sort({ transactionDate: -1, createdAt: -1 }).limit(100).toArray();
}

export async function getDiamondLedgerEntries() {
  const db = await getDb();
  return db.collection("diamondInventoryLedger").find({}).sort({ transactionDate: -1, createdAt: -1 }).limit(100).toArray();
}
