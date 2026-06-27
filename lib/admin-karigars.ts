import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export type KarigarListItem = {
  id: string;
  karigarCode: string;
  name: string;
  specialization: string;
  labourRate: string;
  pendingIssue: string;
  pendingReceipt: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

export type KarigarFormValues = {
  name: string;
  fatherName: string;
  mobile: string;
  alternateMobile: string;
  email: string;
  aadhaar: string;
  pan: string;
  gst: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  specialization: string;
  labourType: "PER_GRAM" | "PER_PIECE" | "FIXED";
  labourRate: string;
  openingBalance: string;
  creditBalance: string;
  joiningDate: string;
  remarks: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid karigar id.");
  return new ObjectId(id);
}

function normalizeText(value: string) {
  return value.trim();
}

async function nextKarigarCode() {
  const db = await getDb();
  const latest = await db.collection("karigars").find({}).sort({ karigarCode: -1 }).limit(1).toArray();
  const number = Number(String(latest[0]?.karigarCode ?? "K0000").replace(/\D/g, "")) || 0;
  return `K${String(number + 1).padStart(4, "0")}`;
}

export async function getKarigars() {
  const db = await getDb();
  const karigars = await db.collection("karigars").find({}).sort({ createdAt: -1 }).toArray();
  return karigars.map(
    (karigar) =>
      ({
        id: String(karigar._id),
        karigarCode: String(karigar.karigarCode ?? ""),
        name: String(karigar.name ?? ""),
        specialization: String(karigar.specialization ?? ""),
        labourRate: String(karigar.labourRate ?? ""),
        pendingIssue: String(karigar.pendingIssue ?? "0"),
        pendingReceipt: String(karigar.pendingReceipt ?? "0"),
        status: (karigar.status ?? "ACTIVE") as KarigarListItem["status"],
      }) satisfies KarigarListItem
  );
}

export async function getKarigarById(id: string) {
  const db = await getDb();
  const karigar = await db.collection("karigars").findOne({ _id: toObjectId(id) });
  if (!karigar) return null;
  return {
    id: String(karigar._id),
    name: String(karigar.name ?? ""),
    fatherName: String(karigar.fatherName ?? ""),
    mobile: String(karigar.mobile ?? ""),
    alternateMobile: String(karigar.alternateMobile ?? ""),
    email: String(karigar.email ?? ""),
    aadhaar: String(karigar.aadhaar ?? ""),
    pan: String(karigar.pan ?? ""),
    gst: String(karigar.gst ?? ""),
    address: String(karigar.address ?? ""),
    city: String(karigar.city ?? ""),
    state: String(karigar.state ?? ""),
    pincode: String(karigar.pincode ?? ""),
    country: String(karigar.country ?? ""),
    specialization: String(karigar.specialization ?? ""),
    labourType: (karigar.labourType ?? "PER_GRAM") as KarigarFormValues["labourType"],
    labourRate: String(karigar.labourRate ?? ""),
    openingBalance: String(karigar.openingBalance ?? "0"),
    creditBalance: String(karigar.creditBalance ?? "0"),
    joiningDate: String(karigar.joiningDate ?? ""),
    remarks: String(karigar.remarks ?? ""),
    status: (karigar.status ?? "ACTIVE") as KarigarFormValues["status"],
  };
}

export async function createKarigar(input: KarigarFormValues) {
  const db = await getDb();
  const karigarCode = await nextKarigarCode();
  const now = new Date();
  const result = await db.collection("karigars").insertOne({
    karigarCode,
    name: normalizeText(input.name),
    fatherName: normalizeText(input.fatherName),
    mobile: normalizeText(input.mobile),
    alternateMobile: normalizeText(input.alternateMobile),
    email: normalizeText(input.email).toLowerCase(),
    aadhaar: normalizeText(input.aadhaar),
    pan: normalizeText(input.pan),
    gst: normalizeText(input.gst),
    address: normalizeText(input.address),
    city: normalizeText(input.city),
    state: normalizeText(input.state),
    pincode: normalizeText(input.pincode),
    country: normalizeText(input.country),
    specialization: normalizeText(input.specialization),
    labourType: input.labourType,
    labourRate: normalizeText(input.labourRate),
    openingBalance: normalizeText(input.openingBalance),
    creditBalance: normalizeText(input.creditBalance),
    joiningDate: normalizeText(input.joiningDate),
    remarks: normalizeText(input.remarks),
    status: input.status,
    pendingIssue: "0",
    pendingReceipt: "0",
    createdAt: now,
    updatedAt: now,
  });
  return { id: String(result.insertedId) };
}

export async function updateKarigar(id: string, input: KarigarFormValues) {
  const db = await getDb();
  const karigarId = toObjectId(id);
  const existing = await db.collection("karigars").findOne({ _id: karigarId });
  if (!existing) throw new Error("Karigar not found.");
  await db.collection("karigars").updateOne(
    { _id: karigarId },
    {
      $set: {
        name: normalizeText(input.name),
        fatherName: normalizeText(input.fatherName),
        mobile: normalizeText(input.mobile),
        alternateMobile: normalizeText(input.alternateMobile),
        email: normalizeText(input.email).toLowerCase(),
        aadhaar: normalizeText(input.aadhaar),
        pan: normalizeText(input.pan),
        gst: normalizeText(input.gst),
        address: normalizeText(input.address),
        city: normalizeText(input.city),
        state: normalizeText(input.state),
        pincode: normalizeText(input.pincode),
        country: normalizeText(input.country),
        specialization: normalizeText(input.specialization),
        labourType: input.labourType,
        labourRate: normalizeText(input.labourRate),
        openingBalance: normalizeText(input.openingBalance),
        creditBalance: normalizeText(input.creditBalance),
        joiningDate: normalizeText(input.joiningDate),
        remarks: normalizeText(input.remarks),
        status: input.status,
        updatedAt: new Date(),
      },
    }
  );
  return { id };
}

export async function deleteKarigar(id: string) {
  const db = await getDb();
  const karigarId = toObjectId(id);
  const existing = await db.collection("karigars").findOne({ _id: karigarId });
  if (!existing) throw new Error("Karigar not found.");
  await db.collection("karigars").deleteOne({ _id: karigarId });
  return { id };
}

