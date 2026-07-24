import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { formatCode, nextSequence } from "@/lib/sequences";
import { deleteR2Objects } from "@/lib/r2-cleanup";

export type VendorListItem = {
  id: string;
  vendorCode: string;
  vendorType: "GOLD" | "DIAMOND" | "BOTH";
  companyName: string;
  ownerName: string;
  mobile: string;
  gstNumber: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  logoUrl: string;
};

export type VendorFormValues = {
  vendorType: "GOLD" | "DIAMOND" | "BOTH";
  companyName: string;
  ownerName: string;
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
  openingBalance: string;
  creditDays: string;
  remarks: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  logoUrl?: string;
  gstDocUrl?: string;
  panDocUrl?: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid vendor id.");
  }

  return new ObjectId(id);
}

function normalizeText(value: string) {
  return value.trim();
}

export async function getVendors() {
  const db = await getDb();
  const vendors = await db.collection("vendors").find({}).sort({ createdAt: -1 }).toArray();

  return vendors.map(
    (vendor) =>
      ({
        id: String(vendor._id),
        vendorCode: String(vendor.vendorCode ?? ""),
        vendorType: (vendor.vendorType ?? "GOLD") as VendorListItem["vendorType"],
        companyName: String(vendor.companyName ?? ""),
        ownerName: String(vendor.ownerName ?? ""),
        mobile: String(vendor.mobile ?? ""),
        gstNumber: String(vendor.gstNumber ?? ""),
        status: (vendor.status ?? "ACTIVE") as VendorListItem["status"],
        createdAt: vendor.createdAt ? new Date(vendor.createdAt).toISOString() : "",
        logoUrl: String(vendor.logoUrl ?? ""),
      }) satisfies VendorListItem
  );
}

export async function getVendorById(id: string) {
  const db = await getDb();
  const vendor = await db.collection("vendors").findOne({ _id: toObjectId(id) });

  if (!vendor) {
    return null;
  }

  return {
    id: String(vendor._id),
    vendorType: (vendor.vendorType ?? "GOLD") as VendorFormValues["vendorType"],
    companyName: String(vendor.companyName ?? ""),
    ownerName: String(vendor.ownerName ?? ""),
    mobile: String(vendor.mobile ?? ""),
    alternateMobile: String(vendor.alternateMobile ?? ""),
    email: String(vendor.email ?? ""),
    gstNumber: String(vendor.gstNumber ?? ""),
    panNumber: String(vendor.panNumber ?? ""),
    address: String(vendor.address ?? ""),
    city: String(vendor.city ?? ""),
    state: String(vendor.state ?? ""),
    pincode: String(vendor.pincode ?? ""),
    country: String(vendor.country ?? ""),
    openingBalance: String(vendor.openingBalance ?? "0"),
    creditDays: String(vendor.creditDays ?? "0"),
    remarks: String(vendor.remarks ?? ""),
    status: (vendor.status ?? "ACTIVE") as VendorFormValues["status"],
    logoUrl: String(vendor.logoUrl ?? ""),
    gstDocUrl: String(vendor.gstDocUrl ?? ""),
    panDocUrl: String(vendor.panDocUrl ?? ""),
  };
}

async function nextVendorCode() {
  return formatCode("V", await nextSequence("vendor"));
}

export async function createVendor(input: VendorFormValues) {
  const db = await getDb();
  const vendorCode = await nextVendorCode();
  const now = new Date();

  const result = await db.collection("vendors").insertOne({
    vendorCode,
    vendorType: input.vendorType,
    companyName: normalizeText(input.companyName),
    ownerName: normalizeText(input.ownerName),
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
    openingBalance: normalizeText(input.openingBalance),
    creditDays: normalizeText(input.creditDays),
    remarks: normalizeText(input.remarks),
    status: input.status,
    logoUrl: normalizeText(input.logoUrl ?? ""),
    gstDocUrl: normalizeText(input.gstDocUrl ?? ""),
    panDocUrl: normalizeText(input.panDocUrl ?? ""),
    createdAt: now,
    updatedAt: now,
  });

  return { id: String(result.insertedId) };
}

export async function updateVendor(id: string, input: VendorFormValues) {
  const db = await getDb();
  const vendorId = toObjectId(id);
  const existing = await db.collection("vendors").findOne({ _id: vendorId });

  if (!existing) {
    throw new Error("Vendor not found.");
  }

  await db.collection("vendors").updateOne(
    { _id: vendorId },
    {
      $set: {
        vendorType: input.vendorType,
        companyName: normalizeText(input.companyName),
        ownerName: normalizeText(input.ownerName),
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
        openingBalance: normalizeText(input.openingBalance),
        creditDays: normalizeText(input.creditDays),
        remarks: normalizeText(input.remarks),
        status: input.status,
        logoUrl: normalizeText(input.logoUrl ?? ""),
        gstDocUrl: normalizeText(input.gstDocUrl ?? ""),
        panDocUrl: normalizeText(input.panDocUrl ?? ""),
        updatedAt: new Date(),
      },
    }
  );

  return { id };
}

export async function deleteVendor(id: string) {
  const db = await getDb();
  const vendorId = toObjectId(id);
  const existing = await db.collection("vendors").findOne({ _id: vendorId });

  if (!existing) {
    throw new Error("Vendor not found.");
  }

  // Prevent deleting vendors with dependent transactions.
  const [gold, diamond] = await Promise.all([
    db.collection("goldPurchases").countDocuments({ vendorId }),
    db.collection("diamondPurchases").countDocuments({ vendorId }),
  ]);
  if (gold + diamond > 0) {
    throw new Error(
      `Cannot delete vendor — ${gold + diamond} purchase record(s) reference it. Deactivate the vendor instead.`
    );
  }

  await db.collection("vendors").deleteOne({ _id: vendorId });

  // Best-effort R2 cleanup for any files the vendor owned.
  await deleteR2Objects([
    existing.logoUrl as string,
    existing.gstDocUrl as string,
    existing.panDocUrl as string,
  ]);

  return { id };
}

