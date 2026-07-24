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

export type KarigarListItem = {
  id: string;
  karigarCode: string;
  name: string;
  specialization: string;
  labourRate: string;
  pendingIssue: string;
  pendingReceipt: string;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  photoUrl: string;
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
  // Extended fields (Workstream 3a)
  gender?: string;
  skillLevel?: string;
  photoUrl?: string;
  aadhaarDocUrl?: string;
  panDocUrl?: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid karigar id.");
  return new ObjectId(id);
}

function normalizeText(value: string) {
  return value.trim();
}

async function nextKarigarCode() {
  return formatCode("K", await nextSequence("karigar"));
}

const KARIGAR_SEARCH_FIELDS = [
  "karigarCode",
  "name",
  "fatherName",
  "mobile",
  "specialization",
];
const KARIGAR_SORT_FIELDS = [
  "createdAt",
  "name",
  "karigarCode",
  "status",
] as const;

function mapKarigar(karigar: Record<string, unknown>): KarigarListItem {
  return {
    id: String(karigar._id),
    karigarCode: String(karigar.karigarCode ?? ""),
    name: String(karigar.name ?? ""),
    specialization: String(karigar.specialization ?? ""),
    labourRate: String(karigar.labourRate ?? ""),
    pendingIssue: String(karigar.pendingIssue ?? "0"),
    pendingReceipt: String(karigar.pendingReceipt ?? "0"),
    status: (karigar.status ?? "ACTIVE") as KarigarListItem["status"],
    photoUrl: String(karigar.photoUrl ?? ""),
  } satisfies KarigarListItem;
}

/**
 * Return a lightweight list of active karigars for dropdowns / pickers.
 * Never paginated — a business is expected to have tens, not thousands,
 * of karigars. Callers that need pagination should use `getKarigars()`.
 */
export async function getKarigarOptions(): Promise<Array<{ id: string; name: string; karigarCode: string }>> {
  const db = await getDb();
  const rows = await db
    .collection("karigars")
    .find({ status: "ACTIVE" }, { projection: { name: 1, karigarCode: 1 } })
    .sort({ name: 1 })
    .toArray();
  return rows.map((r) => ({
    id: String(r._id),
    name: String(r.name ?? ""),
    karigarCode: String(r.karigarCode ?? ""),
  }));
}

export async function getKarigars(
  query?: ListQuery
): Promise<PaginatedResult<KarigarListItem>> {
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
    textSearchFilter(q.search, KARIGAR_SEARCH_FIELDS),
    q.status ? { status: q.status } : undefined
  );
  const sort = buildSort(q.sortField, q.sortDir, KARIGAR_SORT_FIELDS, "createdAt");
  const [total, docs] = await Promise.all([
    db.collection("karigars").countDocuments(filter),
    db.collection("karigars").find(filter).sort(sort).skip(q.skip).limit(q.limit).toArray(),
  ]);
  return paginate(docs.map(mapKarigar), total, q);
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
    gender: String(karigar.gender ?? ""),
    skillLevel: String(karigar.skillLevel ?? ""),
    photoUrl: String(karigar.photoUrl ?? ""),
    aadhaarDocUrl: String(karigar.aadhaarDocUrl ?? ""),
    panDocUrl: String(karigar.panDocUrl ?? ""),
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
    gender: normalizeText(input.gender ?? ""),
    skillLevel: normalizeText(input.skillLevel ?? ""),
    photoUrl: normalizeText(input.photoUrl ?? ""),
    aadhaarDocUrl: normalizeText(input.aadhaarDocUrl ?? ""),
    panDocUrl: normalizeText(input.panDocUrl ?? ""),
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
        gender: normalizeText(input.gender ?? ""),
        skillLevel: normalizeText(input.skillLevel ?? ""),
        photoUrl: normalizeText(input.photoUrl ?? ""),
        aadhaarDocUrl: normalizeText(input.aadhaarDocUrl ?? ""),
        panDocUrl: normalizeText(input.panDocUrl ?? ""),
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

  const [issues, receipts] = await Promise.all([
    db.collection("karigarIssues").countDocuments({ karigarId }),
    db.collection("karigarReceipts").countDocuments({ karigarId }),
  ]);
  if (issues + receipts > 0) {
    throw new Error(
      `Cannot delete karigar — ${issues + receipts} manufacturing record(s) reference this karigar. Deactivate instead.`
    );
  }

  await db.collection("karigars").deleteOne({ _id: karigarId });

  await deleteR2Objects([
    existing.photoUrl as string,
    existing.aadhaarDocUrl as string,
    existing.panDocUrl as string,
  ]);

  return { id };
}

