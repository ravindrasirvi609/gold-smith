import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

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

async function nextCode(collectionName: string, prefix: string) {
  const db = await getDb();
  const latest = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).limit(1).toArray();
  const current = String(latest[0]?.[collectionName === "karigarIssues" ? "issueNo" : collectionName === "karigarReceipts" ? "receiptNo" : "jewelCode"] ?? `${prefix}0000`);
  const number = Number(current.replace(/\D/g, "")) || 0;
  return `${prefix}${String(number + 1).padStart(4, "0")}`;
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

export async function getIssues() {
  const db = await getDb();
  const issues = await db.collection("karigarIssues").aggregate([
    { $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } },
    { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();
  return issues.map((issue) => ({
    id: String(issue._id),
    issueNo: String(issue.issueNo ?? ""),
    issueDate: String(issue.issueDate ?? ""),
    karigarName: String(issue.karigarDoc?.name ?? ""),
    status: String(issue.status ?? "DRAFT"),
    goldCount: Array.isArray(issue.gold) ? issue.gold.length : 0,
    diamondCount: Array.isArray(issue.diamonds) ? issue.diamonds.length : 0,
  }));
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
  const db = await getDb();
  const issueId = oid(id);
  await db.collection("goldInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  await db.collection("diamondInventoryLedger").deleteMany({ referenceType: "KarigarIssue", referenceId: issueId });
  await db.collection("karigarIssues").deleteOne({ _id: issueId });
  return { id };
}

export async function getReceipts() {
  const db = await getDb();
  const receipts = await db.collection("karigarReceipts").aggregate([
    { $lookup: { from: "karigarIssues", localField: "issueId", foreignField: "_id", as: "issueDoc" } },
    { $lookup: { from: "karigars", localField: "karigarId", foreignField: "_id", as: "karigarDoc" } },
    { $unwind: { path: "$karigarDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();
  return receipts.map((receipt) => ({
    id: String(receipt._id),
    receiptNo: String(receipt.receiptNo ?? ""),
    receiveDate: String(receipt.receiveDate ?? ""),
    karigarName: String(receipt.karigarDoc?.name ?? ""),
    status: String(receipt.status ?? "PENDING"),
    labourCharge: String(receipt.labourCharge ?? "0"),
    issueNo: String(receipt.issueDoc?.[0]?.issueNo ?? ""),
  }));
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

export async function getProducts() {
  const db = await getDb();
  return db.collection("products").find({}).sort({ createdAt: -1 }).toArray();
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

