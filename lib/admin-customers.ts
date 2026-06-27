import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type CustomerListItem = {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  mobile: string;
  city: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
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
  const db = await getDb();
  const latest = await db.collection("customers").find({}).sort({ customerCode: -1 }).limit(1).toArray();
  const number = Number(String(latest[0]?.customerCode ?? "C0000").replace(/\D/g, "")) || 0;
  return `C${String(number + 1).padStart(4, "0")}`;
}

export async function getCustomers() {
  const db = await getDb();
  const customers = await db.collection("customers").find({}).sort({ createdAt: -1 }).toArray();
  return customers.map(
    (customer) =>
      ({
        id: String(customer._id),
        customerCode: String(customer.customerCode ?? ""),
        firstName: String(customer.firstName ?? ""),
        lastName: String(customer.lastName ?? ""),
        mobile: String(customer.mobile ?? ""),
        city: String(customer.city ?? ""),
        status: (customer.status ?? "ACTIVE") as CustomerListItem["status"],
      }) satisfies CustomerListItem
  );
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
  await db.collection("customers").deleteOne({ _id: customerId });
  return { id };
}

