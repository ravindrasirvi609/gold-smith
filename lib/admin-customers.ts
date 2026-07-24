import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { formatCode, nextSequence } from "@/lib/sequences";
import { deleteR2Objects } from "@/lib/r2-cleanup";
import {
  andFilters,
  buildSort,
  paginate,
  textSearchFilter,
  type ListQuery,
  type PaginatedResult,
} from "@/lib/list-query";

export type CustomerListItem = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  mobile: string;
  city: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  photoUrl: string;
};

export type CustomerFormValues = {
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  anniversary: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  remarks: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  photoUrl?: string;
  idProofUrl?: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid customer id.");
  }
  return new ObjectId(id);
}

function normalizeText(value: string) {
  return value.trim();
}

async function nextCustomerCode() {
  return formatCode("C", await nextSequence("customer"));
}

const CUSTOMER_SEARCH_FIELDS = [
  "customerCode",
  "firstName",
  "lastName",
  "mobile",
  "email",
  "city",
];
const CUSTOMER_SORT_FIELDS = [
  "createdAt",
  "firstName",
  "customerCode",
  "status",
] as const;

function mapCustomer(customer: Record<string, unknown>): CustomerListItem {
  return {
    id: String(customer._id),
    customerCode: String(customer.customerCode ?? ""),
    firstName: String(customer.firstName ?? ""),
    lastName: String(customer.lastName ?? ""),
    mobile: String(customer.mobile ?? ""),
    city: String(customer.city ?? ""),
    status: (customer.status ?? "ACTIVE") as CustomerListItem["status"],
    photoUrl: String(customer.photoUrl ?? ""),
  } satisfies CustomerListItem;
}

export async function getCustomers(
  query?: ListQuery
): Promise<PaginatedResult<CustomerListItem>> {
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
    textSearchFilter(q.search, CUSTOMER_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, CUSTOMER_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("customers").countDocuments(filter),
    db.collection("customers").find(filter).sort(sort).skip(q.skip).limit(q.limit).toArray(),
  ]);
  return paginate(docs.map(mapCustomer), total, q);
}

export async function getCustomerById(id: string) {
  const db = await getDb();
  const customer = await db.collection("customers").findOne({ _id: toObjectId(id) });
  if (!customer) return null;
  return {
    id: String(customer._id),
    firstName: String(customer.firstName ?? ""),
    lastName: String(customer.lastName ?? ""),
    gender: String(customer.gender ?? ""),
    dob: String(customer.dob ?? ""),
    anniversary: String(customer.anniversary ?? ""),
    mobile: String(customer.mobile ?? ""),
    alternateMobile: String(customer.alternateMobile ?? ""),
    email: String(customer.email ?? ""),
    gstNumber: String(customer.gstNumber ?? ""),
    panNumber: String(customer.panNumber ?? ""),
    address: String(customer.address ?? ""),
    city: String(customer.city ?? ""),
    state: String(customer.state ?? ""),
    pincode: String(customer.pincode ?? ""),
    country: String(customer.country ?? ""),
    remarks: String(customer.remarks ?? ""),
    status: (customer.status ?? "ACTIVE") as CustomerFormValues["status"],
    photoUrl: String(customer.photoUrl ?? ""),
    idProofUrl: String(customer.idProofUrl ?? ""),
  };
}

export async function createCustomer(input: CustomerFormValues) {
  const db = await getDb();
  const customerCode = await nextCustomerCode();
  const now = new Date();
  const result = await db.collection("customers").insertOne({
    customerCode,
    firstName: normalizeText(input.firstName),
    lastName: normalizeText(input.lastName),
    gender: normalizeText(input.gender),
    dob: normalizeText(input.dob),
    anniversary: normalizeText(input.anniversary),
    mobile: normalizeText(input.mobile),
    alternateMobile: normalizeText(input.alternateMobile),
    email: normalizeText(input.email).toLowerCase(),
    gstNumber: normalizeText(input.gstNumber),
    panNumber: normalizeText(input.panNumber),
    address: normalizeText(input.address),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    pincode: normalizeText(input.pincode),
    country: normalizeText(input.country),
    remarks: normalizeText(input.remarks),
    status: input.status,
    photoUrl: normalizeText(input.photoUrl ?? ""),
    idProofUrl: normalizeText(input.idProofUrl ?? ""),
    createdAt: now,
    updatedAt: now,
  });
  return { id: String(result.insertedId) };
}

export async function updateCustomer(id: string, input: CustomerFormValues) {
  const db = await getDb();
  const customerId = toObjectId(id);
  const existing = await db.collection("customers").findOne({ _id: customerId });
  if (!existing) throw new Error("Customer not found.");

  await db.collection("customers").updateOne(
    { _id: customerId },
    {
      $set: {
        firstName: normalizeText(input.firstName),
        lastName: normalizeText(input.lastName),
        gender: normalizeText(input.gender),
        dob: normalizeText(input.dob),
        anniversary: normalizeText(input.anniversary),
        mobile: normalizeText(input.mobile),
        alternateMobile: normalizeText(input.alternateMobile),
        email: normalizeText(input.email).toLowerCase(),
        gstNumber: normalizeText(input.gstNumber),
        panNumber: normalizeText(input.panNumber),
        address: normalizeText(input.address),
        city: normalizeText(input.city),
        state: normalizeText(input.state),
        pincode: normalizeText(input.pincode),
        country: normalizeText(input.country),
        remarks: normalizeText(input.remarks),
        status: input.status,
        photoUrl: normalizeText(input.photoUrl ?? ""),
        idProofUrl: normalizeText(input.idProofUrl ?? ""),
        updatedAt: new Date(),
      },
    }
  );
  return { id };
}

export async function deleteCustomer(id: string) {
  const db = await getDb();
  const customerId = toObjectId(id);
  const existing = await db.collection("customers").findOne({ _id: customerId });
  if (!existing) throw new Error("Customer not found.");

  // Block deletion if the customer has any invoice, approval, or payment.
  const [invoices, approvals, payments] = await Promise.all([
    db.collection("invoices").countDocuments({ customerId }),
    db.collection("approvals").countDocuments({ customerId }),
    db.collection("payments").countDocuments({ customerId }),
  ]);
  const total = invoices + approvals + payments;
  if (total > 0) {
    throw new Error(
      `Cannot delete customer — ${total} transaction(s) reference this customer. Deactivate instead.`
    );
  }

  await db.collection("customers").deleteOne({ _id: customerId });

  await deleteR2Objects([
    existing.photoUrl as string,
    existing.idProofUrl as string,
  ]);

  return { id };
}

