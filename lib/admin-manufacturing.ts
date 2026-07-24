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

export type IssueStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
export type ReceiptStatus = "PENDING" | "COMPLETED" | "REJECTED";
export type ProductStatus = "AVAILABLE" | "APPROVAL" | "RESERVED" | "SOLD" | "REPAIR" | "RETURNED" | "SCRAPPED";

export type IssueGoldItem = { inventoryTransactionId: string; purity: string; grossWeight: string; pureWeight: string };
export type IssueDiamondItem = { inventoryTransactionId: string; sieveSize: string; pcs: string; carat: string };
export type ReceiptDiamondItem = { sieveSize: string; pcs: string; carat: string };
export type ReceiptJewelItem = {
  category: string;
  subCategory: string;
  productName: string;
  quantity: string;
  grossWeight: string;
  netWeight: string;
  purity: string;
  wastage: string;
  makingCharge: string;
  diamond: ReceiptDiamondItem[];
  remarks: string;
};

function oid(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function text(value: unknown) {
  return String(value ?? "").trim();
}

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Atomic sequence-based code generator. Replaces the previous find-max
// pattern which was not safe under concurrent writes.
async function nextCode(collectionName: string, prefix: string) {
  const { formatCode, nextSequence } = await import("@/lib/sequences");
  const seqName =
    collectionName === "karigarIssues"
      ? "karigarIssue"
      : collectionName === "karigarReceipts"
      ? "karigarReceipt"
      : "product";
  return formatCode(prefix, await nextSequence(seqName));
}

async function getIssue(issueId: string) {
  const db = await getDb();
  const issue = await db.collection("karigarIssues").findOne({ _id: oid(issueId) });
  if (!issue) throw new Error("Issue not found.");
  return issue;
}

async function issueStockAdjustments(issueId: ObjectId, issueNo: string, gold: IssueGoldItem[], diamonds: IssueDiamondItem[], remarks: string, createdBy?: string) {
  const db = await getDb();
  const now = new Date();
  const goldEntries = gold.map((item) => ({
    transactionDate: now,
    transactionType: "KARIGAR_ISSUE",
    referenceType: "KarigarIssue",
    referenceId: issueId,
    referenceNo: issueNo,
    purity: text(item.purity),
    grossWeight: text(item.grossWeight),
    pureWeight: text(item.pureWeight),
    inWeight: 0,
    outWeight: num(item.pureWeight),
    balanceAfterTransaction: 0,
    remarks,
    createdBy: createdBy ? new ObjectId(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  }));
  const diamondEntries = diamonds.map((item) => ({
    transactionDate: now,
    transactionType: "KARIGAR_ISSUE",
    referenceType: "KarigarIssue",
    referenceId: issueId,
    referenceNo: issueNo,
    sieveSize: text(item.sieveSize),
    pcsIn: 0,
    pcsOut: num(item.pcs),
    caratIn: 0,
    caratOut: num(item.carat),
    balancePcs: 0,
    balanceCarat: 0,
    remarks,
    createdBy: createdBy ? new ObjectId(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  }));
  if (goldEntries.length) await db.collection("goldInventoryLedger").insertMany(goldEntries);
  if (diamondEntries.length) await db.collection("diamondInventoryLedger").insertMany(diamondEntries);
}

export async function getIssueOptions() {
  const db = await getDb();
  return db.collection("karigarIssues").aggregate([
    { $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } },
    { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();
}

export type IssueListItem = {
  id: string;
  issueNo: string;
  issueDate: string;
  karigarName: string;
  status: string;
  goldCount: number;
  diamondCount: number;
};

const ISSUE_SEARCH_FIELDS = ["issueNo", "designReference", "notes"];
const ISSUE_SORT_FIELDS = ["createdAt", "issueNo", "issueDate"] as const;

function defaultManufacturingQuery(): ListQuery {
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

/**
 * Return a lightweight list of open karigar issues (status ISSUED or
 * PARTIALLY_RECEIVED) for the "create receipt" picker. Not paginated.
 */
export async function getOpenIssueOptions(): Promise<Array<{ id: string; issueNo: string }>> {
  const db = await getDb();
  const rows = await db
    .collection("karigarIssues")
    .find(
      { status: { $in: ["ISSUED", "PARTIALLY_RECEIVED"] } },
      { projection: { issueNo: 1 } }
    )
    .sort({ createdAt: -1 })
    .toArray();
  return rows.map((r) => ({
    id: String(r._id),
    issueNo: String(r.issueNo ?? ""),
  }));
}

export async function getIssues(
  query?: ListQuery
): Promise<PaginatedResult<IssueListItem>> {
  const db = await getDb();
  const q = query ?? defaultManufacturingQuery();
  const filter = andFilters(
    textSearchFilter(q.search, ISSUE_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, ISSUE_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("karigarIssues").countDocuments(filter),
    db.collection("karigarIssues").aggregate([
      { $match: filter },
      { $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } },
      { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: IssueListItem[] = docs.map((issue) => ({
    id: String(issue._id),
    issueNo: String(issue.issueNo ?? ""),
    issueDate: String(issue.issueDate ?? ""),
    karigarName: String(issue.karigarDoc?.name ?? ""),
    status: String(issue.status ?? "DRAFT"),
    goldCount: Array.isArray(issue.gold) ? issue.gold.length : 0,
    diamondCount: Array.isArray(issue.diamonds) ? issue.diamonds.length : 0,
  }));
  return paginate(items, total, q);
}

export async function getIssueById(id: string) {
  const issue = await getIssue(id);
  return {
    id: String(issue._id),
    karigarId: String(issue.karigarId ?? ""),
    issueDate: String(issue.issueDate ?? ""),
    designReference: String(issue.designReference ?? ""),
    expectedDeliveryDate: String(issue.expectedDeliveryDate ?? ""),
    gold: Array.isArray(issue.gold) ? issue.gold : [],
    diamonds: Array.isArray(issue.diamonds) ? issue.diamonds : [],
    notes: String(issue.notes ?? ""),
    status: String(issue.status ?? "DRAFT") as IssueStatus,
    challanUrl: String(issue.challanUrl ?? ""),
  };
}

export async function createIssue(input: {
  karigarId: string;
  issueDate: string;
  designReference: string;
  expectedDeliveryDate: string;
  gold: IssueGoldItem[];
  diamonds: IssueDiamondItem[];
  notes: string;
  status: IssueStatus;
  challanUrl?: string;
}, createdBy?: string) {
  const db = await getDb();
  if (!ObjectId.isValid(input.karigarId)) throw new Error("Please select a valid karigar.");
  const karigar = await db.collection("karigars").findOne({ _id: oid(input.karigarId), status: "ACTIVE" });
  if (!karigar) throw new Error("Selected karigar does not exist or is inactive.");
  const issueNo = await nextCode("karigarIssues", "KI");
  const now = new Date();
  const result = await db.collection("karigarIssues").insertOne({
    issueNo,
    issueDate: text(input.issueDate),
    karigarId: oid(input.karigarId),
    designReference: text(input.designReference),
    expectedDeliveryDate: text(input.expectedDeliveryDate),
    gold: input.gold,
    diamonds: input.diamonds,
    notes: text(input.notes),
    status: input.status,
    challanUrl: text(input.challanUrl ?? ""),
    issuedBy: createdBy ? oid(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  });
  if (input.status === "ISSUED" || input.status === "COMPLETED" || input.status === "PARTIALLY_RECEIVED") {
    await issueStockAdjustments(result.insertedId, issueNo, input.gold, input.diamonds, input.notes, createdBy);
  }
  return { id: String(result.insertedId) };
}

export async function updateIssue(id: string, input: {
  karigarId: string;
  issueDate: string;
  designReference: string;
  expectedDeliveryDate: string;
  gold: IssueGoldItem[];
  diamonds: IssueDiamondItem[];
  notes: string;
  status: IssueStatus;
  challanUrl?: string;
}, updatedBy?: string) {
  const db = await getDb();
  const issueId = oid(id);
  const existing = await db.collection("karigarIssues").findOne({ _id: issueId });
  if (!existing) throw new Error("Issue not found.");
  await db.collection("karigarIssues").updateOne({ _id: issueId }, { $set: { karigarId: oid(input.karigarId), issueDate: text(input.issueDate), designReference: text(input.designReference), expectedDeliveryDate: text(input.expectedDeliveryDate), gold: input.gold, diamonds: input.diamonds, notes: text(input.notes), status: input.status, challanUrl: text(input.challanUrl ?? ""), updatedBy: updatedBy ? oid(updatedBy) : null, updatedAt: new Date() } });
  await db.collection("goldInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  await db.collection("diamondInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  if (input.status !== "CANCELLED") await issueStockAdjustments(issueId, String(existing.issueNo ?? ""), input.gold, input.diamonds, input.notes, updatedBy);
  return { id };
}

export async function deleteIssue(id: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const issueId = oid(id);
  const existing = await db.collection("karigarIssues").findOne({ _id: issueId });
  if (!existing) throw new Error("Issue not found.");

  // Block deletion if any receipt references this issue.
  const receipts = await db
    .collection("karigarReceipts")
    .countDocuments({ issueId });
  if (receipts > 0) {
    throw new Error(
      `Cannot delete issue — ${receipts} receipt(s) reference it. Cancel the issue instead.`
    );
  }

  await db.collection("goldInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  await db.collection("diamondInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  await db.collection("karigarIssues").deleteOne({ _id: issueId });
  await deleteR2Objects([existing.challanUrl as string]);
  return { id };
}

export type ReceiptListItem = {
  id: string;
  receiptNo: string;
  receiveDate: string;
  karigarName: string;
  status: string;
  labourCharge: string;
  issueNo: string;
};

const RECEIPT_SEARCH_FIELDS = ["receiptNo"];
const RECEIPT_SORT_FIELDS = ["createdAt", "receiptNo", "receiveDate"] as const;

export async function getReceipts(
  query?: ListQuery
): Promise<PaginatedResult<ReceiptListItem>> {
  const db = await getDb();
  const q = query ?? defaultManufacturingQuery();
  const filter = andFilters(
    textSearchFilter(q.search, RECEIPT_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, RECEIPT_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("karigarReceipts").countDocuments(filter),
    db.collection("karigarReceipts").aggregate([
      { $match: filter },
      { $lookup: { from: "karigarIssues", localField: "issueId", foreignField: "_id", as: "issueDoc" } },
      { $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } },
      { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: ReceiptListItem[] = docs.map((receipt) => ({
    id: String(receipt._id),
    receiptNo: String(receipt.receiptNo ?? ""),
    receiveDate: String(receipt.receiveDate ?? ""),
    karigarName: String(receipt.karigarDoc?.name ?? ""),
    status: String(receipt.status ?? "PENDING"),
    labourCharge: String(receipt.labourCharge ?? "0"),
    issueNo: String(receipt.issueDoc?.[0]?.issueNo ?? ""),
  }));
  return paginate(items, total, q);
}

export async function getReceiptById(id: string) {
  const db = await getDb();
  const receipt = await db.collection("karigarReceipts").findOne({ _id: oid(id) });
  if (!receipt) return null;
  return {
    id: String(receipt._id),
    issueId: String(receipt.issueId ?? ""),
    receiveDate: String(receipt.receiveDate ?? ""),
    labourCharge: String(receipt.labourCharge ?? "0"),
    labourType: String(receipt.labourType ?? ""),
    jewellery: Array.isArray(receipt.jewellery) ? receipt.jewellery : [],
    status: String(receipt.status ?? "PENDING") as ReceiptStatus,
    signedReceiptUrl: String(receipt.signedReceiptUrl ?? ""),
  };
}

async function createProductFromReceipt(receiptId: ObjectId, receiptNo: string, jewel: ReceiptJewelItem, imageUrl: string, createdBy?: string) {
  const db = await getDb();
  const jewelCode = await nextCode("products", "JC");
  const now = new Date();
  const product = await db.collection("products").insertOne({
    jewelCode,
    barcode: jewelCode,
    qrCode: jewelCode,
    category: text(jewel.category),
    subCategory: text(jewel.subCategory),
    productName: text(jewel.productName),
    designNo: "",
    collection: "",
    purity: text(jewel.purity),
    grossWeight: text(jewel.grossWeight),
    netWeight: text(jewel.netWeight),
    stoneWeight: "0",
    diamond: jewel.diamond,
    makingCharge: text(jewel.makingCharge),
    labourCharge: "0",
    sellingPrice: "0",
    image: imageUrl || null,
    currentLocation: "STORE",
    status: "AVAILABLE" satisfies ProductStatus,
    karigarIssue: null,
    karigarReceipt: receiptId,
    createdAt: now,
    updatedAt: now,
  });
  await db.collection("productHistory").insertOne({
    productId: product.insertedId,
    event: "PRODUCT_CREATED",
    referenceType: "KarigarReceipt",
    referenceId: receiptId,
    performedBy: createdBy ? oid(createdBy) : null,
    date: now,
    location: "STORE",
    remarks: `Auto-created from receipt ${receiptNo}`,
    createdAt: now,
    updatedAt: now,
  });
}

export async function createReceipt(input: {
  issueId: string;
  receiveDate: string;
  labourCharge: string;
  labourType: string;
  jewellery: ReceiptJewelItem[];
  status: ReceiptStatus;
  signedReceiptUrl?: string;
  productImageUrl?: string;
}, createdBy?: string) {
  const db = await getDb();
  const issue = await getIssue(input.issueId);
  const receiptNo = await nextCode("karigarReceipts", "KR");
  const now = new Date();
  const result = await db.collection("karigarReceipts").insertOne({
    receiptNo,
    issueId: oid(input.issueId),
    karigarId: issue.karigarId,
    receiveDate: text(input.receiveDate),
    labourCharge: text(input.labourCharge),
    labourType: text(input.labourType),
    jewellery: input.jewellery,
    status: input.status,
    signedReceiptUrl: text(input.signedReceiptUrl ?? ""),
    receivedBy: createdBy ? oid(createdBy) : null,
    createdAt: now,
    updatedAt: now,
  });
  if (input.status === "COMPLETED") {
    for (const jewel of input.jewellery) await createProductFromReceipt(result.insertedId, receiptNo, jewel, input.productImageUrl ?? "", createdBy);
    await db.collection("karigarIssues").updateOne({ _id: oid(input.issueId) }, { $set: { status: "COMPLETED", updatedAt: now } });
  }
  return { id: String(result.insertedId) };
}

/**
 * Update a karigar receipt.
 *
 * Rules:
 *  - Once a receipt is COMPLETED and its products are downstream (sold, on
 *    approval, etc.) the receipt fields become mostly immutable to protect
 *    downstream references. We allow only status, labourCharge, and
 *    signedReceiptUrl changes in that case.
 *  - Transitioning a PENDING receipt to COMPLETED triggers the same
 *    product-creation flow as createReceipt.
 */
export async function updateReceipt(
  id: string,
  input: {
    receiveDate: string;
    labourCharge: string;
    labourType: string;
    jewellery: ReceiptJewelItem[];
    status: ReceiptStatus;
    signedReceiptUrl?: string;
    productImageUrl?: string;
  },
  updatedBy?: string
) {
  const db = await getDb();
  const receiptId = oid(id);
  const existing = await db
    .collection("karigarReceipts")
    .findOne({ _id: receiptId });
  if (!existing) throw new Error("Receipt not found.");

  const wasCompleted = existing.status === "COMPLETED";
  const willBeCompleted = input.status === "COMPLETED";
  const now = new Date();
  const receiptNo = String(existing.receiptNo ?? "");

  // If products have already been created from this receipt, only allow
  // metadata changes — never rewrite jewellery.
  const linkedProducts = await db
    .collection("products")
    .countDocuments({ karigarReceipt: receiptId });

  if (wasCompleted && linkedProducts > 0) {
    await db.collection("karigarReceipts").updateOne(
      { _id: receiptId },
      {
        $set: {
          labourCharge: text(input.labourCharge),
          labourType: text(input.labourType),
          signedReceiptUrl: text(input.signedReceiptUrl ?? ""),
          updatedBy: updatedBy ? oid(updatedBy) : null,
          updatedAt: now,
        },
      }
    );
    return { id };
  }

  await db.collection("karigarReceipts").updateOne(
    { _id: receiptId },
    {
      $set: {
        receiveDate: text(input.receiveDate),
        labourCharge: text(input.labourCharge),
        labourType: text(input.labourType),
        jewellery: input.jewellery,
        status: input.status,
        signedReceiptUrl: text(input.signedReceiptUrl ?? ""),
        updatedBy: updatedBy ? oid(updatedBy) : null,
        updatedAt: now,
      },
    }
  );

  if (!wasCompleted && willBeCompleted) {
    for (const jewel of input.jewellery) {
      await createProductFromReceipt(
        receiptId,
        receiptNo,
        jewel,
        input.productImageUrl ?? "",
        updatedBy
      );
    }
    if (existing.issueId) {
      await db.collection("karigarIssues").updateOne(
        { _id: existing.issueId as ObjectId },
        { $set: { status: "COMPLETED", updatedAt: now } }
      );
    }
  }

  return { id };
}

/**
 * Delete a karigar receipt. Blocked if any downstream product is not
 * disposable (i.e. sold or on approval) — those products would lose their
 * chain of custody. Cleans up related productHistory and R2 attachments.
 */
export async function deleteReceipt(id: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const receiptId = oid(id);
  const existing = await db
    .collection("karigarReceipts")
    .findOne({ _id: receiptId });
  if (!existing) throw new Error("Receipt not found.");

  const products = await db
    .collection("products")
    .find({ karigarReceipt: receiptId })
    .toArray();
  const productIds = products.map((p) => p._id);
  const blocked = products.filter(
    (p) => p.status !== "AVAILABLE" && p.status !== "SCRAPPED"
  );
  if (blocked.length > 0) {
    throw new Error(
      `Cannot delete receipt — ${blocked.length} downstream product(s) are on approval or sold. Reverse those first.`
    );
  }

  await db.collection("products").deleteMany({ karigarReceipt: receiptId });
  await db
    .collection("productHistory")
    .deleteMany({ productId: { $in: productIds } });
  await db.collection("karigarReceipts").deleteOne({ _id: receiptId });
  await deleteR2Objects([existing.signedReceiptUrl as string]);
  return { id };
}

/**
 * Delete a product. Only permitted while the product is AVAILABLE — sold,
 * on-approval, and reserved products stay in place for audit reasons.
 */
export async function deleteProduct(id: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const productId = oid(id);
  const existing = await db
    .collection("products")
    .findOne({ _id: productId });
  if (!existing) throw new Error("Product not found.");
  if (existing.status !== "AVAILABLE") {
    throw new Error(
      `Cannot delete product in status "${String(existing.status)}". Only AVAILABLE products can be removed.`
    );
  }
  await db.collection("productHistory").deleteMany({ productId });
  await db.collection("products").deleteOne({ _id: productId });
  await deleteR2Objects([existing.image as string]);
  return { id };
}

export type ProductListItem = {
  id: string;
  jewelCode: string;
  productName: string;
  category: string;
  subCategory: string;
  purity: string;
  netWeight: string;
  status: string;
  location: string;
  image: string;
  createdAt: string;
};

const PRODUCT_SEARCH_FIELDS = [
  "jewelCode",
  "productName",
  "category",
  "subCategory",
  "purity",
];
const PRODUCT_SORT_FIELDS = [
  "createdAt",
  "productName",
  "jewelCode",
  "status",
] as const;

function mapProduct(product: Record<string, unknown>): ProductListItem {
  return {
    id: String(product._id),
    jewelCode: String(product.jewelCode ?? ""),
    productName: String(product.productName ?? ""),
    category: String(product.category ?? ""),
    subCategory: String(product.subCategory ?? ""),
    purity: String(product.purity ?? ""),
    netWeight: String(product.netWeight ?? ""),
    status: String(product.status ?? ""),
    location: String(product.location ?? ""),
    image: String(product.image ?? ""),
    createdAt: product.createdAt
      ? new Date(product.createdAt as string).toISOString()
      : "",
  } satisfies ProductListItem;
}

export async function getProducts(
  query?: ListQuery
): Promise<PaginatedResult<ProductListItem>> {
  const db = await getDb();
  const q: ListQuery = query ?? {
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
  const filter = andFilters(
    textSearchFilter(q.search, PRODUCT_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, PRODUCT_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("products").countDocuments(filter),
    db.collection("products").find(filter).sort(sort).skip(q.skip).limit(q.limit).toArray(),
  ]);
  return paginate(docs.map(mapProduct), total, q);
}

export async function getProductById(id: string) {
  const db = await getDb();
  return db.collection("products").findOne({ _id: oid(id) });
}

export async function getHistory() {
  const db = await getDb();
  return db.collection("productHistory").aggregate([
    { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "productDoc" } },
    { $lookup: { from: "users", localField: "performedBy", foreignField: "_id", as: "userDoc" } },
    { $unwind: { path: "$productDoc", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { date: -1, createdAt: -1 } },
  ]).toArray();
}

