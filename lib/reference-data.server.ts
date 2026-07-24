import "server-only";

import { getDb } from "@/lib/mongodb";
import {
  STATIC_EDITABLE_SEED,
  type EditableKind,
  type Option,
} from "@/lib/reference-data";

/**
 * Return every option for one editable kind, sorted by label.
 * Falls back to the static seed if no rows have been created yet, so
 * fresh installs work before the seed script has been run.
 */
export async function getEditableOptions(
  kind: EditableKind
): Promise<Option[]> {
  const db = await getDb();
  const rows = await db
    .collection("referenceData")
    .find({ kind, isActive: { $ne: false } })
    .sort({ label: 1 })
    .toArray();

  if (rows.length) {
    return rows.map((row) => ({
      value: String(row.value ?? ""),
      label: String(row.label ?? ""),
      hint: row.hint ? String(row.hint) : undefined,
    }));
  }

  return STATIC_EDITABLE_SEED[kind]?.slice() ?? [];
}
