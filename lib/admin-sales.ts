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

export type ApprovalStatus = "DRAFT" | "ISSUED" | "PARTIALLY_RETURNED" | "RETURNED" | "CONVERTED_TO_SALE" | "CANCELLED" | "EXPIRED";
export type InvoiceStatus = "DRAFT" | "PENDING_PAYMENT" | "PAID" | "PARTIALLY_PAID" | "CANCELLED" | "RETURNED";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED" | "CANCELLED";
export type PaymentType = "Cash" | "UPI" | "Cheque" | "RTGS" | "NEFT" | "Card" | "Bank Transfer";

function oid(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid id.");
  return new ObjectId(id);
}

function s(value: unknown) {
  return String(value ?? "");
}

function n(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

// Atomic sequence-based code generator. Replaces the previous find-max
// pattern which was not safe under concurrent writes.
async function nextNo(collectionName: string, field: string, prefix: string) {
  // Retain args for backwards-compat with existing callers; only the prefix
  // is meaningful here — the sequence name is derived from it.
  void collectionName;
  void field;
  const { formatDashedCode, nextSequence } = await import("@/lib/sequences");
  const seqName =
    prefix === "APP-"
      ? "approval"
      : prefix === "INV-"
      ? "invoice"
      : "payment";
  const bare = prefix.replace(/-$/, "");
  return formatDashedCode(bare, await nextSequence(seqName));
}

async function logAudit(input: {
  userId?: string | null;
  module: string;
  action: string;
  referenceType?: string;
  referenceId?: string | null;
  description: string;
  oldData?: unknown;
  newData?: unknown;
}) {
  const db = await getDb();
  const now = new Date();
  await db.collection("auditLogs").insertOne({
    userId: input.userId ? oid(input.userId) : null,
    module: input.module,
    action: input.action,
    referenceType: input.referenceType ?? null,
    referenceId: input.referenceId ? String(input.referenceId) : null,
    ipAddress: null,
    device: null,
    browser: null,
    oldData: input.oldData ?? null,
    newData: input.newData ?? null,
    description: input.description,
    createdAt: now,
  });
}

export async function createAuditLog(entry: Parameters<typeof logAudit>[0]) {
  return logAudit(entry);
}

async function getActiveCustomer(customerId: string) {
  const db = await getDb();
  if (!ObjectId.isValid(customerId)) throw new Error("Please select a valid customer.");
  const customer = await db.collection("customers").findOne({ _id: oid(customerId), status: "ACTIVE" });
  if (!customer) throw new Error("Selected customer does not exist or is inactive.");
  return customer;
}

async function getAvailableProduct(productId: string) {
  const db = await getDb();
  const product = await db.collection("products").findOne({ _id: oid(productId) });
  if (!product) throw new Error("Selected product does not exist.");
  return product;
}

export type ApprovalListItem = {
  id: string;
  approvalNo: string;
  customerName: string;
  issueDate: string;
  expectedReturnDate: string;
  status: ApprovalStatus;
  productCount: number;
};

const APPROVAL_SEARCH_FIELDS = ["approvalNo", "purpose"];
const APPROVAL_SORT_FIELDS = ["createdAt", "approvalNo", "status"] as const;

function defaultListQuery(): ListQuery {
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

export async function getApprovals(
  query?: ListQuery
): Promise<PaginatedResult<ApprovalListItem>> {
  const db = await getDb();
  const q = query ?? defaultListQuery();
  const filter = andFilters(
    textSearchFilter(q.search, APPROVAL_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, APPROVAL_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("approvals").countDocuments(filter),
    db.collection("approvals").aggregate([
      { $match: filter },
      { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: ApprovalListItem[] = docs.map((approval) => ({
    id: s(approval._id),
    approvalNo: s(approval.approvalNo ?? ""),
    customerName: s(approval.customerDoc?.firstName ? `${approval.customerDoc.firstName} ${approval.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    issueDate: s(approval.issueDate ?? ""),
    expectedReturnDate: s(approval.expectedReturnDate ?? ""),
    status: s(approval.status ?? "DRAFT") as ApprovalStatus,
    productCount: Array.isArray(approval.products) ? approval.products.length : 0,
  }));
  return paginate(items, total, q);
}

export async function getApprovalById(id: string) {
  const db = await getDb();
  const approval = await db.collection("approvals").findOne({ _id: oid(id) });
  if (!approval) return null;
  return {
    id: s(approval._id),
    customerId: s(approval.customerId ?? ""),
    issueDate: s(approval.issueDate ?? ""),
    expectedReturnDate: s(approval.expectedReturnDate ?? ""),
    purpose: s(approval.purpose ?? ""),
    remarks: s(approval.remarks ?? ""),
    status: s(approval.status ?? "DRAFT") as ApprovalStatus,
    products: Array.isArray(approval.products) ? approval.products : [],
  };
}

export async function createApproval(input: {
  customerId: string;
  issueDate: string;
  expectedReturnDate: string;
  purpose: string;
  remarks: string;
  status: ApprovalStatus;
  products: { productId: string; issueWeight: string; quantity: string; remarks: string }[];
}, userId?: string) {
  const db = await getDb();
  const approvalNo = await nextNo("approvals", "approvalNo", "APP-");
  await getActiveCustomer(input.customerId);
  const products = [];
  for (const row of input.products) {
    const product = await getAvailableProduct(row.productId);
    products.push({
      productId: oid(row.productId),
      jewelCode: s(product.jewelCode ?? ""),
      issueWeight: s(row.issueWeight),
      quantity: s(row.quantity),
      remarks: s(row.remarks),
    });
  }
  const now = new Date();
  const result = await db.collection("approvals").insertOne({
    approvalNo,
    customerId: oid(input.customerId),
    issueDate: s(input.issueDate),
    expectedReturnDate: s(input.expectedReturnDate),
    purpose: s(input.purpose),
    remarks: s(input.remarks),
    status: input.status,
    products,
    createdBy: userId ? oid(userId) : null,
    updatedBy: userId ? oid(userId) : null,
    createdAt: now,
    updatedAt: now,
  });

  for (const product of products) {
    await db.collection("products").updateOne({ _id: product.productId }, { $set: { status: "APPROVAL", currentLocation: "CUSTOMER", updatedAt: now } });
    await db.collection("productHistory").insertOne({
      productId: product.productId,
      event: "APPROVAL_ISSUE",
      referenceType: "Approval",
      referenceId: s(result.insertedId),
      performedBy: userId ? oid(userId) : null,
      date: now,
      location: "CUSTOMER",
      remarks: `Approval ${approvalNo}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  await logAudit({ userId, module: "Approval", action: "Create", referenceType: "Approval", referenceId: s(result.insertedId), description: `Created approval ${approvalNo}`, newData: input });
  return { id: s(result.insertedId) };
}

export async function updateApproval(id: string, input: Parameters<typeof createApproval>[0], userId?: string) {
  const db = await getDb();
  const approvalId = oid(id);
  const existing = await db.collection("approvals").findOne({ _id: approvalId });
  if (!existing) throw new Error("Approval not found.");
  await db.collection("approvals").updateOne({ _id: approvalId }, { $set: { customerId: oid(input.customerId), issueDate: s(input.issueDate), expectedReturnDate: s(input.expectedReturnDate), purpose: s(input.purpose), remarks: s(input.remarks), status: input.status, updatedBy: userId ? oid(userId) : null, updatedAt: new Date() } });
  await logAudit({ userId, module: "Approval", action: "Update", referenceType: "Approval", referenceId: id, description: `Updated approval ${s(existing.approvalNo ?? "")}`, oldData: existing, newData: input });
  return { id };
}

export type InvoiceListItem = {
  id: string;
  invoiceNo: string;
  customerName: string;
  invoiceDate: string;
  grandTotal: string;
  paymentStatus: InvoiceStatus;
  saleType: string;
};

const INVOICE_SEARCH_FIELDS = ["invoiceNo", "saleType"];
const INVOICE_SORT_FIELDS = ["createdAt", "invoiceNo", "invoiceDate"] as const;

export async function getInvoices(
  query?: ListQuery
): Promise<PaginatedResult<InvoiceListItem>> {
  const db = await getDb();
  const q = query ?? defaultListQuery();
  const filter = andFilters(
    textSearchFilter(q.search, INVOICE_SEARCH_FIELDS),
    q.status ? { paymentStatus: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, INVOICE_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("invoices").countDocuments(filter),
    db.collection("invoices").aggregate([
      { $match: filter },
      { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: InvoiceListItem[] = docs.map((invoice) => ({
    id: s(invoice._id),
    invoiceNo: s(invoice.invoiceNo ?? ""),
    customerName: s(invoice.customerDoc?.firstName ? `${invoice.customerDoc.firstName} ${invoice.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    invoiceDate: s(invoice.invoiceDate ?? ""),
    grandTotal: s(invoice.grandTotal ?? "0"),
    paymentStatus: s(invoice.paymentStatus ?? "DRAFT") as InvoiceStatus,
    saleType: s(invoice.saleType ?? "Direct"),
  }));
  return paginate(items, total, q);
}

export async function getInvoiceById(id: string) {
  const db = await getDb();
  const invoice = await db.collection("invoices").findOne({ _id: oid(id) });
  if (!invoice) return null;
  return {
    id: s(invoice._id),
    customerId: s(invoice.customerId ?? ""),
    approvalId: invoice.approvalId ? s(invoice.approvalId) : "",
    invoiceDate: s(invoice.invoiceDate ?? ""),
    saleType: s(invoice.saleType ?? "Direct"),
    remarks: s(invoice.remarks ?? ""),
    paymentStatus: s(invoice.paymentStatus ?? "DRAFT") as InvoiceStatus,
    products: Array.isArray(invoice.products) ? invoice.products : [],
  };
}

export async function createInvoice(input: {
  customerId: string;
  approvalId?: string;
  invoiceDate: string;
  saleType: string;
  remarks: string;
  paymentStatus: InvoiceStatus;
  products: { productId: string; quantity: string; goldRate: string; makingCharge: string; stoneAmount: string; discount: string; gst: string }[];
}, userId?: string) {
  const db = await getDb();
  await getActiveCustomer(input.customerId);
  const invoiceNo = await nextNo("invoices", "invoiceNo", "INV-");
  const products = [];
  for (const row of input.products) {
    const product = await getAvailableProduct(row.productId);
    const total = n(row.quantity) * n(row.goldRate) + n(row.makingCharge) + n(row.stoneAmount) - n(row.discount) + n(row.gst);
    products.push({ productId: oid(row.productId), jewelCode: s(product.jewelCode ?? ""), quantity: s(row.quantity), goldRate: s(row.goldRate), makingCharge: s(row.makingCharge), stoneAmount: s(row.stoneAmount), discount: s(row.discount), gst: s(row.gst), total: total.toFixed(2) });
  }
  const grandTotal = products.reduce((sum, item) => sum + n(item.total), 0);
  const now = new Date();
  const result = await db.collection("invoices").insertOne({
    invoiceNo,
    invoiceDate: s(input.invoiceDate),
    customerId: oid(input.customerId),
    approvalId: input.approvalId ? oid(input.approvalId) : null,
    saleType: s(input.saleType),
    products,
    subtotal: grandTotal.toFixed(2),
    discount: "0",
    gst: "0",
    grandTotal: grandTotal.toFixed(2),
    paymentStatus: input.paymentStatus,
    remarks: s(input.remarks),
    soldBy: userId ? oid(userId) : null,
    createdAt: now,
    updatedAt: now,
  });
  for (const row of products) {
    await db.collection("products").updateOne({ _id: row.productId }, { $set: { status: "SOLD", updatedAt: now } });
    await db.collection("productHistory").insertOne({
      productId: row.productId,
      event: "INVOICE_CREATED",
      referenceType: "Invoice",
      referenceId: result.insertedId,
      performedBy: userId ? oid(userId) : null,
      date: now,
      location: "SOLD",
      remarks: `Invoice ${invoiceNo}`,
      createdAt: now,
      updatedAt: now,
    });
  }
  await logAudit({ userId, module: "Invoice", action: "Create", referenceType: "Invoice", referenceId: s(result.insertedId), description: `Created invoice ${invoiceNo}`, newData: input });
  return { id: s(result.insertedId) };
}

export type PaymentListItem = {
  id: string;
  paymentNo: string;
  invoiceNo: string;
  customerName: string;
  paymentDate: string;
  paymentType: string;
  amount: string;
  status: PaymentStatus;
  attachmentUrl: string;
};

const PAYMENT_SEARCH_FIELDS = ["paymentNo", "paymentType", "referenceNo"];
const PAYMENT_SORT_FIELDS = ["createdAt", "paymentNo", "paymentDate"] as const;

async function getPaymentsInternal(
  query?: ListQuery
): Promise<PaginatedResult<PaymentListItem>> {
  const db = await getDb();
  const q = query ?? defaultListQuery();
  const filter = andFilters(
    textSearchFilter(q.search, PAYMENT_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, PAYMENT_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("payments").countDocuments(filter),
    db.collection("payments").aggregate([
      { $match: filter },
      { $lookup: { from: "invoices", localField: "invoiceId", foreignField: "_id", as: "invoiceDoc" } },
      { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
      { $unwind: { path: "$invoiceDoc", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: PaymentListItem[] = docs.map((payment) => ({
    id: s(payment._id),
    paymentNo: s(payment.paymentNo ?? ""),
    invoiceNo: s(payment.invoiceDoc?.invoiceNo ?? ""),
    customerName: s(payment.customerDoc?.firstName ? `${payment.customerDoc.firstName} ${payment.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    paymentDate: s(payment.paymentDate ?? ""),
    paymentType: s(payment.paymentType ?? ""),
    amount: s(payment.amount ?? "0"),
    status: s(payment.status ?? "PENDING") as PaymentStatus,
    attachmentUrl: s(payment.attachmentUrl ?? ""),
  }));
  return paginate(items, total, q);
}

export const getPayments = getPaymentsInternal;

export async function createPayment(input: {
  invoiceId: string;
  customerId: string;
  paymentDate: string;
  paymentType: PaymentType;
  transactionId: string;
  referenceNumber: string;
  bankName: string;
  amount: string;
  remarks: string;
  status: PaymentStatus;
  attachmentUrl?: string;
}, userId?: string) {
  const db = await getDb();
  const paymentNo = await nextNo("payments", "paymentNo", "PAY-");
  await getActiveCustomer(input.customerId);
  const now = new Date();
  const result = await db.collection("payments").insertOne({
    paymentNo,
    invoiceId: oid(input.invoiceId),
    customerId: oid(input.customerId),
    paymentDate: s(input.paymentDate),
    paymentType: input.paymentType,
    transactionId: s(input.transactionId),
    referenceNumber: s(input.referenceNumber),
    bankName: s(input.bankName),
    amount: s(input.amount),
    remarks: s(input.remarks),
    attachmentUrl: s(input.attachmentUrl ?? ""),
    receivedBy: userId ? oid(userId) : null,
    status: input.status,
    createdAt: now,
    updatedAt: now,
  });
  await logAudit({ userId, module: "Payment", action: "Create", referenceType: "Payment", referenceId: s(result.insertedId), description: `Created payment ${paymentNo}`, newData: input });
  return { id: s(result.insertedId) };
}

export async function getSettings() {
  const db = await getDb();
  return db.collection("settings").find({}).sort({ key: 1 }).toArray();
}

export async function upsertSetting(input: { key: string; value: unknown; description: string }, userId?: string) {
  const db = await getDb();
  const now = new Date();
  await db.collection("settings").updateOne(
    { key: input.key },
    { $set: { value: input.value, description: input.description, updatedBy: userId ? oid(userId) : null, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  await logAudit({ userId, module: "Settings", action: "Update", referenceType: "Setting", referenceId: input.key, description: `Updated setting ${input.key}`, newData: input.value });
  return { key: input.key };
}

export type AuditLogListItem = {
  id: string;
  module: string;
  action: string;
  description: string;
  userName: string;
  userEmail: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
};

const AUDIT_SEARCH_FIELDS = ["module", "action", "description", "referenceType"];
const AUDIT_SORT_FIELDS = ["createdAt"] as const;

export async function getAuditLogs(
  query?: ListQuery
): Promise<PaginatedResult<AuditLogListItem>> {
  const db = await getDb();
  const q = query ?? { ...defaultListQuery(), pageSize: 50, limit: 50 };
  const filter = andFilters(
    textSearchFilter(q.search, AUDIT_SEARCH_FIELDS),
    q.status ? { module: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, AUDIT_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("auditLogs").countDocuments(filter),
    db.collection("auditLogs").aggregate([
      { $match: filter },
      { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userDoc" } },
      { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
      { $sort: sort as Record<string, 1 | -1> },
      { $skip: q.skip },
      { $limit: q.limit },
    ]).toArray(),
  ]);
  const items: AuditLogListItem[] = docs.map((log) => ({
    id: s(log._id),
    module: s(log.module ?? ""),
    action: s(log.action ?? ""),
    description: s(log.description ?? ""),
    userName: s(log.userDoc?.firstName ? `${log.userDoc.firstName} ${log.userDoc.lastName ?? ""}`.trim() : "System"),
    userEmail: s(log.userDoc?.email ?? ""),
    referenceType: s(log.referenceType ?? ""),
    referenceId: s(log.referenceId ?? ""),
    createdAt: log.createdAt ? new Date(log.createdAt as string).toISOString() : "",
  }));
  return paginate(items, total, q);
}

// =====================================================================
// Approvals — cancel, return, delete
// =====================================================================

/**
 * Cancel an approval that hasn't been converted to a sale. Restores each
 * referenced product back to AVAILABLE / STORE.
 */
export async function cancelApproval(id: string, userId?: string) {
  const db = await getDb();
  const approvalId = oid(id);
  const approval = await db
    .collection("approvals")
    .findOne({ _id: approvalId });
  if (!approval) throw new Error("Approval not found.");
  if (approval.status === "CONVERTED_TO_SALE") {
    throw new Error("Cannot cancel — this approval has been converted to a sale.");
  }
  if (approval.status === "CANCELLED") {
    throw new Error("Approval is already cancelled.");
  }

  const now = new Date();
  const products = Array.isArray(approval.products) ? approval.products : [];
  for (const row of products) {
    const productId = row.productId;
    if (!productId) continue;
    await db.collection("products").updateOne(
      { _id: productId },
      { $set: { status: "AVAILABLE", currentLocation: "STORE", updatedAt: now } }
    );
    await db.collection("productHistory").insertOne({
      productId,
      event: "APPROVAL_CANCELLED",
      referenceType: "Approval",
      referenceId: s(approvalId),
      performedBy: userId ? oid(userId) : null,
      date: now,
      location: "STORE",
      remarks: `Approval ${s(approval.approvalNo ?? "")} cancelled`,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection("approvals").updateOne(
    { _id: approvalId },
    {
      $set: {
        status: "CANCELLED",
        cancelledAt: now,
        updatedBy: userId ? oid(userId) : null,
        updatedAt: now,
      },
    }
  );
  await logAudit({
    userId,
    module: "Approval",
    action: "Cancel",
    referenceType: "Approval",
    referenceId: id,
    description: `Cancelled approval ${s(approval.approvalNo ?? "")}`,
  });
  return { id };
}

/**
 * Return specific products from an approval back to stock. If all products
 * on the approval are returned, the approval transitions to RETURNED.
 */
export async function returnApprovalProducts(
  id: string,
  productIds: string[],
  userId?: string
) {
  const db = await getDb();
  const approvalId = oid(id);
  const approval = await db
    .collection("approvals")
    .findOne({ _id: approvalId });
  if (!approval) throw new Error("Approval not found.");
  if (approval.status === "CANCELLED" || approval.status === "CONVERTED_TO_SALE") {
    throw new Error(
      "Cannot return products from a cancelled or converted approval."
    );
  }
  if (!productIds.length) throw new Error("Select at least one product to return.");

  const now = new Date();
  const returnedSet = new Set(productIds);
  const products = Array.isArray(approval.products) ? approval.products : [];

  for (const row of products) {
    if (!row.productId || !returnedSet.has(String(row.productId))) continue;
    await db.collection("products").updateOne(
      { _id: row.productId },
      { $set: { status: "AVAILABLE", currentLocation: "STORE", updatedAt: now } }
    );
    await db.collection("productHistory").insertOne({
      productId: row.productId,
      event: "APPROVAL_RETURN",
      referenceType: "Approval",
      referenceId: s(approvalId),
      performedBy: userId ? oid(userId) : null,
      date: now,
      location: "STORE",
      remarks: `Returned from approval ${s(approval.approvalNo ?? "")}`,
      createdAt: now,
      updatedAt: now,
    });
  }

  const returned = Array.isArray(approval.returned) ? approval.returned : [];
  const newReturned = Array.from(new Set([...returned, ...productIds]));
  const allReturned = products.every(
    (row) => row.productId && newReturned.includes(String(row.productId))
  );
  await db.collection("approvals").updateOne(
    { _id: approvalId },
    {
      $set: {
        returned: newReturned,
        status: allReturned ? "RETURNED" : "PARTIALLY_RETURNED",
        updatedBy: userId ? oid(userId) : null,
        updatedAt: now,
      },
    }
  );
  await logAudit({
    userId,
    module: "Approval",
    action: "Return",
    referenceType: "Approval",
    referenceId: id,
    description: `Returned ${productIds.length} product(s) from ${s(approval.approvalNo ?? "")}`,
    newData: { productIds },
  });
  return { id, returned: newReturned, allReturned };
}

/**
 * Delete an approval outright. Only allowed for DRAFT or CANCELLED
 * approvals — never for anything with a live product allocation.
 */
export async function deleteApproval(id: string, userId?: string) {
  const db = await getDb();
  const approvalId = oid(id);
  const approval = await db
    .collection("approvals")
    .findOne({ _id: approvalId });
  if (!approval) throw new Error("Approval not found.");
  if (!(approval.status === "DRAFT" || approval.status === "CANCELLED")) {
    throw new Error(
      `Cannot delete an approval in status "${s(approval.status)}". Cancel it first.`
    );
  }
  await db.collection("approvals").deleteOne({ _id: approvalId });
  await logAudit({
    userId,
    module: "Approval",
    action: "Delete",
    referenceType: "Approval",
    referenceId: id,
    description: `Deleted approval ${s(approval.approvalNo ?? "")}`,
  });
  return { id };
}

// =====================================================================
// Invoices — cancel, delete
// =====================================================================

/**
 * Cancel an invoice. Restores every referenced product to AVAILABLE, marks
 * the invoice CANCELLED, and refunds any linked payments (marks them
 * REFUNDED so they don't count toward paid totals).
 */
export async function cancelInvoice(id: string, userId?: string) {
  const db = await getDb();
  const invoiceId = oid(id);
  const invoice = await db
    .collection("invoices")
    .findOne({ _id: invoiceId });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.paymentStatus === "CANCELLED") {
    throw new Error("Invoice is already cancelled.");
  }

  const now = new Date();
  const products = Array.isArray(invoice.products) ? invoice.products : [];
  for (const row of products) {
    if (!row.productId) continue;
    await db.collection("products").updateOne(
      { _id: row.productId },
      { $set: { status: "AVAILABLE", currentLocation: "STORE", updatedAt: now } }
    );
    await db.collection("productHistory").insertOne({
      productId: row.productId,
      event: "INVOICE_CANCELLED",
      referenceType: "Invoice",
      referenceId: s(invoiceId),
      performedBy: userId ? oid(userId) : null,
      date: now,
      location: "STORE",
      remarks: `Invoice ${s(invoice.invoiceNo ?? "")} cancelled`,
      createdAt: now,
      updatedAt: now,
    });
  }

  await db.collection("payments").updateMany(
    { invoiceId, status: { $ne: "REFUNDED" } },
    { $set: { status: "REFUNDED", refundedAt: now, updatedAt: now } }
  );

  await db.collection("invoices").updateOne(
    { _id: invoiceId },
    {
      $set: {
        paymentStatus: "CANCELLED",
        cancelledAt: now,
        cancelledBy: userId ? oid(userId) : null,
        updatedAt: now,
      },
    }
  );
  await logAudit({
    userId,
    module: "Invoice",
    action: "Cancel",
    referenceType: "Invoice",
    referenceId: id,
    description: `Cancelled invoice ${s(invoice.invoiceNo ?? "")}`,
  });
  return { id };
}

/**
 * Delete an invoice. Only permitted for DRAFT invoices — everything else
 * has downstream artifacts (payments, product status changes) that must be
 * unwound by a cancel first.
 */
export async function deleteInvoice(id: string, userId?: string) {
  const db = await getDb();
  const invoiceId = oid(id);
  const invoice = await db.collection("invoices").findOne({ _id: invoiceId });
  if (!invoice) throw new Error("Invoice not found.");
  if (invoice.paymentStatus !== "DRAFT") {
    throw new Error(
      `Cannot delete an invoice in status "${s(invoice.paymentStatus)}". Cancel it first.`
    );
  }
  await db.collection("invoices").deleteOne({ _id: invoiceId });
  await logAudit({
    userId,
    module: "Invoice",
    action: "Delete",
    referenceType: "Invoice",
    referenceId: id,
    description: `Deleted draft invoice ${s(invoice.invoiceNo ?? "")}`,
  });
  return { id };
}

// =====================================================================
// Payments — refund, delete
// =====================================================================

/**
 * Refund a payment. Marks the payment REFUNDED but keeps the record in
 * place. Optionally re-opens the invoice if it was fully paid.
 */
export async function refundPayment(id: string, userId?: string) {
  const db = await getDb();
  const paymentId = oid(id);
  const payment = await db
    .collection("payments")
    .findOne({ _id: paymentId });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status === "REFUNDED") {
    throw new Error("Payment is already refunded.");
  }
  const now = new Date();
  await db.collection("payments").updateOne(
    { _id: paymentId },
    {
      $set: {
        status: "REFUNDED",
        refundedAt: now,
        refundedBy: userId ? oid(userId) : null,
        updatedAt: now,
      },
    }
  );
  // If the invoice was fully paid, transition back to PARTIALLY_PAID so the
  // outstanding balance is visible again.
  if (payment.invoiceId) {
    const invoice = await db
      .collection("invoices")
      .findOne({ _id: payment.invoiceId as ObjectId });
    if (invoice && invoice.paymentStatus === "PAID") {
      await db.collection("invoices").updateOne(
        { _id: payment.invoiceId as ObjectId },
        { $set: { paymentStatus: "PARTIALLY_PAID", updatedAt: now } }
      );
    }
  }
  await logAudit({
    userId,
    module: "Payment",
    action: "Refund",
    referenceType: "Payment",
    referenceId: id,
    description: `Refunded payment ${s(payment.paymentNo ?? "")}`,
  });
  return { id };
}

/**
 * Delete a payment. Only PENDING payments can be deleted outright — for
 * anything already applied, use refundPayment.
 */
export async function deletePayment(id: string, userId?: string) {
  const { deleteR2Objects } = await import("@/lib/r2-cleanup");
  const db = await getDb();
  const paymentId = oid(id);
  const payment = await db
    .collection("payments")
    .findOne({ _id: paymentId });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status !== "PENDING") {
    throw new Error(
      `Cannot delete a payment in status "${s(payment.status)}". Refund it instead.`
    );
  }
  await db.collection("payments").deleteOne({ _id: paymentId });
  await deleteR2Objects([payment.attachmentUrl as string]);
  await logAudit({
    userId,
    module: "Payment",
    action: "Delete",
    referenceType: "Payment",
    referenceId: id,
    description: `Deleted payment ${s(payment.paymentNo ?? "")}`,
  });
  return { id };
}
