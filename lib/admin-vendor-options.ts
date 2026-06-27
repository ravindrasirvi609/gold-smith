import { getDb } from "@/lib/mongodb";

export async function getVendorOptions(types: string[]) {
  const db = await getDb();
  const vendors = await db.collection("vendors").find({ status: "ACTIVE" }).sort({ companyName: 1 }).toArray();
  return vendors.filter((vendor) => types.includes(String(vendor.vendorType ?? ""))).map((vendor) => ({ id: String(vendor._id), name: String(vendor.companyName ?? vendor.ownerName ?? "") }));
}

