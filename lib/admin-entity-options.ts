import { getDb } from "@/lib/mongodb";

/**
 * Lightweight entity-option queries for pickers (Combobox, autocomplete)
 * used throughout the transaction forms.
 *
 * Each function returns a compact `{ value, label, hint }` shape that
 * drops straight into `<Combobox options={…}>`:
 *
 *   value → the ObjectId string we submit back to the API
 *   label → the display line (name or code)
 *   hint  → the secondary line (mobile, city, purity, etc.)
 *
 * These are intentionally not paginated — pickers are for daily-use lists
 * (hundreds of items, not tens of thousands). If a shop ever exceeds a
 * few thousand active customers, we'll switch to a server-side
 * `search=` handler; the API contract can stay the same.
 */

export type EntityOption = {
  value: string;
  label: string;
  hint?: string;
};

const OPTION_LIMIT = 500;

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function getCustomerOptions(): Promise<EntityOption[]> {
  const db = await getDb();
  const rows = await db
    .collection("customers")
    .find(
      { status: "ACTIVE" },
      { projection: { customerCode: 1, firstName: 1, lastName: 1, mobile: 1, city: 1 } }
    )
    .sort({ firstName: 1, lastName: 1 })
    .limit(OPTION_LIMIT)
    .toArray();
  return rows.map((row) => {
    const name = [row.firstName, row.lastName]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean)
      .join(" ");
    return {
      value: String(row._id),
      label: `${String(row.customerCode ?? "")} · ${name || "(no name)"}`,
      hint: [row.mobile, row.city].map((v) => String(v ?? "")).filter(Boolean).join(" · "),
    };
  });
}

// ---------------------------------------------------------------------------
// Vendors — filtered by supported vendor types
// ---------------------------------------------------------------------------

export async function getVendorOptions(
  types?: readonly string[]
): Promise<EntityOption[]> {
  const db = await getDb();
  const filter: Record<string, unknown> = { status: "ACTIVE" };
  if (types && types.length) filter.vendorType = { $in: types };
  const rows = await db
    .collection("vendors")
    .find(filter, {
      projection: {
        vendorCode: 1,
        companyName: 1,
        ownerName: 1,
        vendorType: 1,
        mobile: 1,
      },
    })
    .sort({ companyName: 1 })
    .limit(OPTION_LIMIT)
    .toArray();
  return rows.map((row) => {
    const name = String(row.companyName ?? row.ownerName ?? "");
    return {
      value: String(row._id),
      label: `${String(row.vendorCode ?? "")} · ${name || "(no name)"}`,
      hint: [row.vendorType, row.mobile]
        .map((v) => String(v ?? ""))
        .filter(Boolean)
        .join(" · "),
    };
  });
}

// ---------------------------------------------------------------------------
// Karigars
// ---------------------------------------------------------------------------

export async function getKarigarOptions(): Promise<EntityOption[]> {
  const db = await getDb();
  const rows = await db
    .collection("karigars")
    .find(
      { status: "ACTIVE" },
      { projection: { karigarCode: 1, name: 1, specialization: 1, mobile: 1 } }
    )
    .sort({ name: 1 })
    .limit(OPTION_LIMIT)
    .toArray();
  return rows.map((row) => ({
    value: String(row._id),
    label: `${String(row.karigarCode ?? "")} · ${String(row.name ?? "(no name)")}`,
    hint: [row.specialization, row.mobile]
      .map((v) => String(v ?? ""))
      .filter(Boolean)
      .join(" · "),
  }));
}

// ---------------------------------------------------------------------------
// Invoices — pending/partially-paid invoices for payment picker
// ---------------------------------------------------------------------------

export async function getInvoiceOptions(): Promise<EntityOption[]> {
  const db = await getDb();
  const rows = await db
    .collection("invoices")
    .find(
      { paymentStatus: { $in: ["PENDING_PAYMENT", "PARTIALLY_PAID", "DRAFT"] } },
      { projection: { invoiceNo: 1, invoiceDate: 1, grandTotal: 1, paymentStatus: 1 } }
    )
    .sort({ createdAt: -1 })
    .limit(OPTION_LIMIT)
    .toArray();
  return rows.map((row) => ({
    value: String(row._id),
    label: `${String(row.invoiceNo ?? "")} — ₹${String(row.grandTotal ?? "0")}`,
    hint: String(row.invoiceDate ?? ""),
  }));
}

// ---------------------------------------------------------------------------
// Products — only AVAILABLE, for use on invoice / approval line items
// ---------------------------------------------------------------------------

export async function getAvailableProductOptions(): Promise<EntityOption[]> {
  const db = await getDb();
  const rows = await db
    .collection("products")
    .find(
      { status: "AVAILABLE" },
      {
        projection: {
          jewelCode: 1,
          productName: 1,
          category: 1,
          purity: 1,
          netWeight: 1,
        },
      }
    )
    .sort({ createdAt: -1 })
    .limit(OPTION_LIMIT)
    .toArray();
  return rows.map((row) => ({
    value: String(row._id),
    label: `${String(row.jewelCode ?? "")} · ${String(row.productName ?? "")}`,
    hint: [row.category, row.purity, row.netWeight ? `${row.netWeight}g` : ""]
      .map((v) => String(v ?? ""))
      .filter(Boolean)
      .join(" · "),
  }));
}
