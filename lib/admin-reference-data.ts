import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { EditableKind } from "@/lib/reference-data";

/**
 * Admin CRUD for the `referenceData` collection. Shop owners edit these
 * lists (jewellery sub-categories, karigar specializations, sale types,
 * approval purposes) from the Settings > Reference data screen.
 *
 * Every row shape: { kind, value, label, parent?, hint?, isActive }.
 */

export type ReferenceRow = {
  id: string;
  kind: EditableKind;
  value: string;
  label: string;
  parent: string | null;
  hint: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

function toObjectId(id: string) {
  if (!ObjectId.isValid(id)) throw new Error("Invalid reference-data id.");
  return new ObjectId(id);
}

function toRow(doc: Record<string, unknown>): ReferenceRow {
  return {
    id: String(doc._id),
    kind: String(doc.kind ?? "") as EditableKind,
    value: String(doc.value ?? ""),
    label: String(doc.label ?? ""),
    parent: doc.parent ? String(doc.parent) : null,
    hint: doc.hint ? String(doc.hint) : null,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string).toISOString()
      : "",
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string).toISOString()
      : "",
  };
}

export async function listReferenceRows(kind?: EditableKind): Promise<ReferenceRow[]> {
  const db = await getDb();
  const filter = kind ? { kind } : {};
  const docs = await db
    .collection("referenceData")
    .find(filter)
    .sort({ kind: 1, label: 1 })
    .toArray();
  return docs.map(toRow);
}

export async function createReferenceRow(input: {
  kind: EditableKind;
  value: string;
  label: string;
  parent?: string;
  hint?: string;
}): Promise<ReferenceRow> {
  const db = await getDb();
  const now = new Date();
  const value = input.value.trim().toUpperCase().replace(/\s+/g, "_");
  const label = input.label.trim();
  if (!value) throw new Error("Value is required.");
  if (!label) throw new Error("Label is required.");
  const existing = await db
    .collection("referenceData")
    .findOne({ kind: input.kind, value });
  if (existing) {
    throw new Error(
      `A "${input.kind}" option with value "${value}" already exists.`
    );
  }
  const result = await db.collection("referenceData").insertOne({
    kind: input.kind,
    value,
    label,
    parent: input.parent?.trim() || null,
    hint: input.hint?.trim() || null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  const doc = await db
    .collection("referenceData")
    .findOne({ _id: result.insertedId });
  return toRow(doc!);
}

export async function updateReferenceRow(
  id: string,
  input: { label?: string; parent?: string; hint?: string; isActive?: boolean }
): Promise<ReferenceRow> {
  const db = await getDb();
  const _id = toObjectId(id);
  const $set: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof input.label === "string") $set.label = input.label.trim();
  if (typeof input.parent === "string") $set.parent = input.parent.trim() || null;
  if (typeof input.hint === "string") $set.hint = input.hint.trim() || null;
  if (typeof input.isActive === "boolean") $set.isActive = input.isActive;
  await db.collection("referenceData").updateOne({ _id }, { $set });
  const doc = await db.collection("referenceData").findOne({ _id });
  if (!doc) throw new Error("Reference row not found.");
  return toRow(doc);
}

export async function deleteReferenceRow(id: string): Promise<void> {
  const db = await getDb();
  await db.collection("referenceData").deleteOne({ _id: toObjectId(id) });
}
