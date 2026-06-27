import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

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

async function nextNo(collectionName: string, field: string, prefix: string) {
  const db = await getDb();
  const latest = await db.collection(collectionName).find({}).sort({ createdAt: -1 }).limit(1).toArray();
  const current = s(latest[0]?.[field] ?? `${prefix}0000`);
  const number = Number(current.replace(/\D/g, "")) || 0;
  return `${prefix}${String(number + 1).padStart(5, "0")}`;
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

export async function getApprovals() {
  const db = await getDb();
  const approvals = await db.collection("approvals").aggregate([
    { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
    { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();

  return approvals.map((approval) => ({
    id: s(approval._id),
    approvalNo: s(approval.approvalNo ?? ""),
    customerName: s(approval.customerDoc?.firstName ? `${approval.customerDoc.firstName} ${approval.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    issueDate: s(approval.issueDate ?? ""),
    expectedReturnDate: s(approval.expectedReturnDate ?? ""),
    status: s(approval.status ?? "DRAFT") as ApprovalStatus,
    productCount: Array.isArray(approval.products) ? approval.products.length : 0,
  }));
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

export async function getInvoices() {
  const db = await getDb();
  const invoices = await db.collection("invoices").aggregate([
    { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
    { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();
  return invoices.map((invoice) => ({
    id: s(invoice._id),
    invoiceNo: s(invoice.invoiceNo ?? ""),
    customerName: s(invoice.customerDoc?.firstName ? `${invoice.customerDoc.firstName} ${invoice.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    invoiceDate: s(invoice.invoiceDate ?? ""),
    grandTotal: s(invoice.grandTotal ?? "0"),
    paymentStatus: s(invoice.paymentStatus ?? "DRAFT") as InvoiceStatus,
    saleType: s(invoice.saleType ?? "Direct"),
  }));
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

export async function getPayments() {
  const db = await getDb();
  const payments = await db.collection("payments").aggregate([
    { $lookup: { from: "invoices", localField: "invoiceId", foreignField: "_id", as: "invoiceDoc" } },
    { $lookup: { from: "customers", localField: "customerId", foreignField: "_id", as: "customerDoc" } },
    { $unwind: { path: "$invoiceDoc", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$customerDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
  ]).toArray();
  return payments.map((payment) => ({
    id: s(payment._id),
    paymentNo: s(payment.paymentNo ?? ""),
    invoiceNo: s(payment.invoiceDoc?.invoiceNo ?? ""),
    customerName: s(payment.customerDoc?.firstName ? `${payment.customerDoc.firstName} ${payment.customerDoc.lastName ?? ""}`.trim() : "Unknown"),
    paymentDate: s(payment.paymentDate ?? ""),
    paymentType: s(payment.paymentType ?? ""),
    amount: s(payment.amount ?? "0"),
    status: s(payment.status ?? "PENDING") as PaymentStatus,
  }));
}

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

export async function getAuditLogs() {
  const db = await getDb();
  return db.collection("auditLogs").aggregate([
    { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userDoc" } },
    { $unwind: { path: "$userDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { createdAt: -1 } },
    { $limit: 200 },
  ]).toArray();
}
