/**
 * Reference-data catalog for Gold-Smith.
 *
 * Every closed-set list the app needs, in one place, typed as
 * `Option = { value, label, hint? }`. Consumers (form components, filter
 * bars, badges, reports) import from here so labels and casing stay
 * consistent across every screen.
 *
 * There are two kinds of catalogs in this file:
 *
 *   • STATIC catalogs — hard-coded arrays that represent facts about the
 *     world (Indian states, diamond grades, gold purities). They rarely
 *     change and are safe to bundle into the client.
 *
 *   • EDITABLE catalogs — the shop owner adds to these over time
 *     (jewellery sub-categories, karigar specializations, sale types).
 *     They live in the MongoDB `referenceData` collection and are read
 *     via the server-only `lib/reference-data.server.ts` helper. The
 *     static seed below is what `npm run seed:reference-data` inserts
 *     on first setup.
 *
 * All labels are the exact string we want to display in the UI. All
 * values are the exact string stored in the database.
 */

// ---------------------------------------------------------------------------
// Base type
// ---------------------------------------------------------------------------

export type Option<T extends string = string> = {
  value: T;
  label: string;
  /** Short helper shown next to or below the option in rich pickers. */
  hint?: string;
};

/** Look up the display label for a value, falling back to the value itself. */
export function labelOf<T extends string>(
  options: readonly Option<T>[],
  value: string
): string {
  const match = options.find((o) => o.value === value);
  return match?.label ?? value;
}

// ---------------------------------------------------------------------------
// Region — countries, states
// ---------------------------------------------------------------------------

export type CountryCode = "IN" | "AE" | "US" | "GB" | "SG" | "CA" | "AU";

export const COUNTRIES: readonly Option<CountryCode>[] = [
  { value: "IN", label: "India" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
  { value: "SG", label: "Singapore" },
  { value: "CA", label: "Canada" },
  { value: "AU", label: "Australia" },
];

export const DEFAULT_COUNTRY: CountryCode = "IN";

/**
 * Full list of Indian states and Union Territories, sorted alphabetically.
 * Also used to compute GST place-of-supply for IGST vs CGST+SGST.
 */
export const INDIAN_STATES: readonly Option[] = [
  { value: "AN", label: "Andaman and Nicobar Islands", hint: "UT" },
  { value: "AP", label: "Andhra Pradesh" },
  { value: "AR", label: "Arunachal Pradesh" },
  { value: "AS", label: "Assam" },
  { value: "BR", label: "Bihar" },
  { value: "CH", label: "Chandigarh", hint: "UT" },
  { value: "CT", label: "Chhattisgarh" },
  { value: "DN", label: "Dadra and Nagar Haveli and Daman and Diu", hint: "UT" },
  { value: "DL", label: "Delhi", hint: "UT" },
  { value: "GA", label: "Goa" },
  { value: "GJ", label: "Gujarat" },
  { value: "HR", label: "Haryana" },
  { value: "HP", label: "Himachal Pradesh" },
  { value: "JK", label: "Jammu and Kashmir", hint: "UT" },
  { value: "JH", label: "Jharkhand" },
  { value: "KA", label: "Karnataka" },
  { value: "KL", label: "Kerala" },
  { value: "LA", label: "Ladakh", hint: "UT" },
  { value: "LD", label: "Lakshadweep", hint: "UT" },
  { value: "MP", label: "Madhya Pradesh" },
  { value: "MH", label: "Maharashtra" },
  { value: "MN", label: "Manipur" },
  { value: "ML", label: "Meghalaya" },
  { value: "MZ", label: "Mizoram" },
  { value: "NL", label: "Nagaland" },
  { value: "OR", label: "Odisha" },
  { value: "PY", label: "Puducherry", hint: "UT" },
  { value: "PB", label: "Punjab" },
  { value: "RJ", label: "Rajasthan" },
  { value: "SK", label: "Sikkim" },
  { value: "TN", label: "Tamil Nadu" },
  { value: "TG", label: "Telangana" },
  { value: "TR", label: "Tripura" },
  { value: "UP", label: "Uttar Pradesh" },
  { value: "UT", label: "Uttarakhand" },
  { value: "WB", label: "West Bengal" },
];

/**
 * States by country. Only India is fully populated; other countries fall
 * through to a free-text input in the form components.
 */
export function statesForCountry(country: CountryCode): readonly Option[] {
  return country === "IN" ? INDIAN_STATES : [];
}

// ---------------------------------------------------------------------------
// People — salutation, gender, marital status
// ---------------------------------------------------------------------------

export const SALUTATIONS: readonly Option[] = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
  { value: "Prof", label: "Prof" },
];

export const GENDERS: readonly Option[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
  { value: "PNTS", label: "Prefer not to say" },
];

export const MARITAL_STATUSES: readonly Option[] = [
  { value: "SINGLE", label: "Single" },
  { value: "MARRIED", label: "Married" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
];

export const BLOOD_GROUPS: readonly Option[] = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
].map((v) => ({ value: v, label: v }));

// ---------------------------------------------------------------------------
// Business — vendor type, business type, payment terms
// ---------------------------------------------------------------------------

export type VendorType = "GOLD" | "DIAMOND" | "BOTH" | "SILVER" | "FINDINGS" | "SERVICES";

export const VENDOR_TYPES: readonly Option<VendorType>[] = [
  { value: "GOLD", label: "Gold" },
  { value: "DIAMOND", label: "Diamond" },
  { value: "BOTH", label: "Gold + Diamond" },
  { value: "SILVER", label: "Silver" },
  { value: "FINDINGS", label: "Findings / raw material" },
  { value: "SERVICES", label: "Services (assay, hallmarking, etc.)" },
];

export const BUSINESS_TYPES: readonly Option[] = [
  { value: "PROPRIETOR", label: "Proprietor" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "PVT_LTD", label: "Private Limited" },
  { value: "PUBLIC_LTD", label: "Public Limited" },
  { value: "LLP", label: "LLP" },
  { value: "HUF", label: "HUF" },
  { value: "INDIVIDUAL", label: "Individual" },
];

export const PAYMENT_TERMS: readonly Option[] = [
  { value: "COD", label: "Cash on delivery" },
  { value: "NET_7", label: "Net 7 days" },
  { value: "NET_15", label: "Net 15 days" },
  { value: "NET_30", label: "Net 30 days" },
  { value: "NET_45", label: "Net 45 days" },
  { value: "NET_60", label: "Net 60 days" },
  { value: "ADVANCE", label: "Advance / prepaid" },
];

export const CONTACT_CHANNELS: readonly Option[] = [
  { value: "PHONE", label: "Phone call" },
  { value: "SMS", label: "SMS" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "EMAIL", label: "Email" },
];

export const CUSTOMER_TIERS: readonly Option[] = [
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "VIP", label: "VIP" },
  { value: "CORPORATE", label: "Corporate" },
];

// ---------------------------------------------------------------------------
// Metals — purity
// ---------------------------------------------------------------------------

/**
 * Gold purity grades. `hint` shows the caratage / fineness alongside so
 * the shop team never confuses 22K (916) with 21K (875).
 */
export const GOLD_PURITY: readonly Option[] = [
  { value: "999", label: "24K", hint: "999 fine · investment grade" },
  { value: "916", label: "22K", hint: "916 · standard jewellery" },
  { value: "875", label: "21K", hint: "875 · common in Gulf" },
  { value: "750", label: "18K", hint: "750 · diamond-set pieces" },
  { value: "585", label: "14K", hint: "585 · western jewellery" },
  { value: "417", label: "10K", hint: "417 · budget line" },
  { value: "375", label: "9K", hint: "375 · UK hallmark low" },
];

export const SILVER_PURITY: readonly Option[] = [
  { value: "999", label: "Fine silver", hint: "999 · investment bars" },
  { value: "925", label: "Sterling", hint: "925 · standard jewellery" },
  { value: "900", label: "Coin silver", hint: "900" },
  { value: "800", label: "Continental", hint: "800" },
];

// ---------------------------------------------------------------------------
// Diamond — 4 Cs and sieves
// ---------------------------------------------------------------------------

export const DIAMOND_SHAPES: readonly Option[] = [
  { value: "ROUND", label: "Round brilliant" },
  { value: "PRINCESS", label: "Princess" },
  { value: "EMERALD", label: "Emerald" },
  { value: "ASSCHER", label: "Asscher" },
  { value: "MARQUISE", label: "Marquise" },
  { value: "OVAL", label: "Oval" },
  { value: "RADIANT", label: "Radiant" },
  { value: "PEAR", label: "Pear" },
  { value: "HEART", label: "Heart" },
  { value: "CUSHION", label: "Cushion" },
  { value: "BAGUETTE", label: "Baguette" },
  { value: "TRILLIANT", label: "Trilliant" },
  { value: "ROSE", label: "Rose cut" },
];

/** Colour grades per GIA scale. */
export const DIAMOND_COLOURS: readonly Option[] = [
  { value: "D", label: "D", hint: "Colourless" },
  { value: "E", label: "E", hint: "Colourless" },
  { value: "F", label: "F", hint: "Colourless" },
  { value: "G", label: "G", hint: "Near colourless" },
  { value: "H", label: "H", hint: "Near colourless" },
  { value: "I", label: "I", hint: "Near colourless" },
  { value: "J", label: "J", hint: "Near colourless" },
  { value: "K", label: "K", hint: "Faint" },
  { value: "L", label: "L", hint: "Faint" },
  { value: "M", label: "M", hint: "Faint" },
  { value: "N-R", label: "N–R", hint: "Very light" },
  { value: "S-Z", label: "S–Z", hint: "Light" },
  { value: "FANCY", label: "Fancy colour" },
];

/** Clarity grades per GIA scale. */
export const DIAMOND_CLARITY: readonly Option[] = [
  { value: "FL", label: "FL", hint: "Flawless" },
  { value: "IF", label: "IF", hint: "Internally flawless" },
  { value: "VVS1", label: "VVS1", hint: "Very very slightly included" },
  { value: "VVS2", label: "VVS2" },
  { value: "VS1", label: "VS1", hint: "Very slightly included" },
  { value: "VS2", label: "VS2" },
  { value: "SI1", label: "SI1", hint: "Slightly included" },
  { value: "SI2", label: "SI2" },
  { value: "I1", label: "I1", hint: "Included" },
  { value: "I2", label: "I2" },
  { value: "I3", label: "I3" },
];

export const DIAMOND_CUTS: readonly Option[] = [
  { value: "EX", label: "Excellent" },
  { value: "VG", label: "Very good" },
  { value: "GD", label: "Good" },
  { value: "FR", label: "Fair" },
  { value: "PR", label: "Poor" },
];

/**
 * Industry-standard sieve sizes for melee diamonds. Values are stored as
 * plain strings so we can display them as-is on invoices.
 */
export const DIAMOND_SIEVES: readonly Option[] = [
  "+10",
  "+8",
  "+6",
  "+5",
  "+4",
  "+3",
  "+2",
  "+1",
  "-1",
  "-2",
  "-3",
].map((v) => ({ value: v, label: v }));

// ---------------------------------------------------------------------------
// Jewellery — categories and sub-categories
// ---------------------------------------------------------------------------

export type JewelleryCategory =
  | "RING"
  | "NECKLACE"
  | "CHAIN"
  | "BANGLE"
  | "BRACELET"
  | "EARRING"
  | "PENDANT"
  | "NOSE_PIN"
  | "ANKLET"
  | "TOE_RING"
  | "MANGALSUTRA"
  | "KADA"
  | "NATH"
  | "WAIST_CHAIN"
  | "SET"
  | "COIN"
  | "OTHER";

export const JEWELLERY_CATEGORIES: readonly Option<JewelleryCategory>[] = [
  { value: "RING", label: "Ring" },
  { value: "NECKLACE", label: "Necklace" },
  { value: "CHAIN", label: "Chain" },
  { value: "BANGLE", label: "Bangle" },
  { value: "BRACELET", label: "Bracelet" },
  { value: "EARRING", label: "Earrings" },
  { value: "PENDANT", label: "Pendant" },
  { value: "NOSE_PIN", label: "Nose pin" },
  { value: "ANKLET", label: "Anklet / payal" },
  { value: "TOE_RING", label: "Toe ring / bichhiya" },
  { value: "MANGALSUTRA", label: "Mangalsutra" },
  { value: "KADA", label: "Kada" },
  { value: "NATH", label: "Nath" },
  { value: "WAIST_CHAIN", label: "Waist chain / kamarbandh" },
  { value: "SET", label: "Jewellery set" },
  { value: "COIN", label: "Gold / silver coin" },
  { value: "OTHER", label: "Other" },
];

/**
 * Static seed for jewellery sub-categories keyed by category. Shop owners
 * can add their own via the referenceData admin — this is only the
 * out-of-box list.
 */
export const JEWELLERY_SUBCATEGORIES: Readonly<
  Record<JewelleryCategory, readonly Option[]>
> = {
  RING: [
    { value: "SOLITAIRE", label: "Solitaire" },
    { value: "ENGAGEMENT", label: "Engagement" },
    { value: "WEDDING_BAND", label: "Wedding band" },
    { value: "COCKTAIL", label: "Cocktail" },
    { value: "SIGNET", label: "Signet" },
    { value: "ETERNITY", label: "Eternity" },
    { value: "COUPLE", label: "Couple ring" },
  ],
  NECKLACE: [
    { value: "CHOKER", label: "Choker" },
    { value: "MATINEE", label: "Matinee" },
    { value: "OPERA", label: "Opera" },
    { value: "RANI_HAAR", label: "Rani haar" },
    { value: "BRIDAL", label: "Bridal" },
    { value: "TEMPLE", label: "Temple" },
  ],
  CHAIN: [
    { value: "ROPE", label: "Rope" },
    { value: "BOX", label: "Box" },
    { value: "CURB", label: "Curb" },
    { value: "FIGARO", label: "Figaro" },
    { value: "SNAKE", label: "Snake" },
    { value: "BEAD", label: "Bead" },
    { value: "WHEAT", label: "Wheat" },
  ],
  BANGLE: [
    { value: "PLAIN", label: "Plain" },
    { value: "KADA_STYLE", label: "Kada style" },
    { value: "BRIDAL_SET", label: "Bridal set" },
    { value: "ANTIQUE", label: "Antique" },
    { value: "TEMPLE", label: "Temple" },
    { value: "OPENABLE", label: "Openable" },
  ],
  BRACELET: [
    { value: "TENNIS", label: "Tennis" },
    { value: "CHARM", label: "Charm" },
    { value: "CUFF", label: "Cuff" },
    { value: "LINK", label: "Link" },
    { value: "BEADED", label: "Beaded" },
  ],
  EARRING: [
    { value: "STUD", label: "Stud" },
    { value: "HOOP", label: "Hoop / bali" },
    { value: "DROP", label: "Drop / dangler" },
    { value: "JHUMKA", label: "Jhumka" },
    { value: "CHANDBALI", label: "Chandbali" },
    { value: "EAR_CUFF", label: "Ear cuff" },
  ],
  PENDANT: [
    { value: "SOLITAIRE", label: "Solitaire" },
    { value: "RELIGIOUS", label: "Religious" },
    { value: "LETTER", label: "Initial / letter" },
    { value: "HEART", label: "Heart" },
    { value: "CLUSTER", label: "Cluster" },
  ],
  NOSE_PIN: [
    { value: "STUD", label: "Stud" },
    { value: "RING", label: "Ring" },
    { value: "NATHNI", label: "Nathni" },
  ],
  ANKLET: [
    { value: "PLAIN", label: "Plain" },
    { value: "BEAD", label: "Beaded" },
    { value: "GHUNGROO", label: "With ghungroo" },
  ],
  TOE_RING: [
    { value: "PLAIN", label: "Plain" },
    { value: "STONE", label: "Stone-set" },
  ],
  MANGALSUTRA: [
    { value: "SHORT", label: "Short" },
    { value: "LONG", label: "Long" },
    { value: "MAHARASHTRIAN", label: "Maharashtrian" },
    { value: "DIAMOND", label: "Diamond" },
  ],
  KADA: [
    { value: "PLAIN", label: "Plain" },
    { value: "MENS", label: "Men's kada" },
    { value: "ANTIQUE", label: "Antique" },
  ],
  NATH: [
    { value: "TRADITIONAL", label: "Traditional" },
    { value: "MODERN", label: "Modern" },
  ],
  WAIST_CHAIN: [
    { value: "PLAIN", label: "Plain" },
    { value: "STONE", label: "Stone-set" },
  ],
  SET: [
    { value: "BRIDAL", label: "Bridal set" },
    { value: "PARTY", label: "Party set" },
    { value: "TEMPLE", label: "Temple set" },
    { value: "MEENAKARI", label: "Meenakari set" },
  ],
  COIN: [
    { value: "GOLD_COIN", label: "Gold coin" },
    { value: "SILVER_COIN", label: "Silver coin" },
    { value: "BAR", label: "Bar" },
  ],
  OTHER: [],
};

// ---------------------------------------------------------------------------
// Manufacturing — karigar skills, making-charge basis
// ---------------------------------------------------------------------------

export const KARIGAR_SPECIALIZATIONS: readonly Option[] = [
  { value: "RING", label: "Ring maker" },
  { value: "CHAIN", label: "Chain specialist" },
  { value: "STONE_SETTING", label: "Stone setter" },
  { value: "POLISHING", label: "Polisher" },
  { value: "FILING", label: "Filer" },
  { value: "ENAMELING", label: "Enameling / meenakari" },
  { value: "KUNDAN", label: "Kundan work" },
  { value: "ANTIQUE", label: "Antique work" },
  { value: "BALI", label: "Bali maker" },
  { value: "PLATING", label: "Plating" },
  { value: "CASTING", label: "Casting" },
  { value: "CAD", label: "CAD / CAM designer" },
  { value: "HAND", label: "Hand-crafted / bespoke" },
  { value: "MOULD", label: "Mould maker" },
];

export const SKILL_LEVELS: readonly Option[] = [
  { value: "TRAINEE", label: "Trainee" },
  { value: "JUNIOR", label: "Junior" },
  { value: "SENIOR", label: "Senior" },
  { value: "MASTER", label: "Master craftsman" },
];

export const MAKING_CHARGE_BASIS: readonly Option[] = [
  { value: "PER_GRAM", label: "Per gram" },
  { value: "PER_PIECE", label: "Per piece" },
  { value: "FIXED", label: "Fixed" },
  { value: "PERCENT_GOLD", label: "% of gold value" },
];

export const ISSUE_PRIORITIES: readonly Option[] = [
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "RUSH", label: "Rush" },
];

// ---------------------------------------------------------------------------
// Sales — sale type, approval purpose, invoice type
// ---------------------------------------------------------------------------

export const SALE_TYPES: readonly Option[] = [
  { value: "RETAIL", label: "Retail" },
  { value: "WHOLESALE", label: "Wholesale" },
  { value: "OLD_GOLD_EXCHANGE", label: "Old gold exchange" },
  { value: "REPAIR", label: "Repair charge" },
  { value: "INSTITUTIONAL", label: "Institutional / bulk" },
  { value: "SCHEME_REDEMPTION", label: "Scheme / SIP redemption" },
];

export const APPROVAL_PURPOSES: readonly Option[] = [
  { value: "HOME_TRIAL", label: "Home trial" },
  { value: "FUNCTION", label: "Function / wedding" },
  { value: "COMPARISON", label: "For comparison" },
  { value: "REPAIR_ESTIMATE", label: "Repair estimate" },
  { value: "PHOTOSHOOT", label: "Photoshoot" },
  { value: "OTHER", label: "Other" },
];

export const INVOICE_TYPES: readonly Option[] = [
  { value: "TAX_INVOICE", label: "Tax invoice" },
  { value: "BILL_OF_SUPPLY", label: "Bill of supply", hint: "No GST" },
  { value: "DELIVERY_CHALLAN", label: "Delivery challan" },
  { value: "ESTIMATE", label: "Estimate / quotation" },
  { value: "PROFORMA", label: "Proforma invoice" },
];

// ---------------------------------------------------------------------------
// Status catalog — one place for every status enum
// ---------------------------------------------------------------------------

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

export type StatusOption = Option & { tone: StatusTone };

export const ACTIVE_STATUSES: readonly StatusOption[] = [
  { value: "ACTIVE", label: "Active", tone: "success" },
  { value: "INACTIVE", label: "Inactive", tone: "neutral" },
  { value: "BLOCKED", label: "Blocked", tone: "danger" },
];

export const PURCHASE_STATUSES: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "COMPLETED", label: "Completed", tone: "success" },
  { value: "CANCELLED", label: "Cancelled", tone: "danger" },
];

export const ISSUE_STATUSES: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "ISSUED", label: "Issued", tone: "info" },
  { value: "PARTIALLY_RECEIVED", label: "Partially received", tone: "warning" },
  { value: "COMPLETED", label: "Completed", tone: "success" },
  { value: "CANCELLED", label: "Cancelled", tone: "danger" },
];

export const RECEIPT_STATUSES: readonly StatusOption[] = [
  { value: "PENDING", label: "Pending", tone: "warning" },
  { value: "COMPLETED", label: "Completed", tone: "success" },
  { value: "REJECTED", label: "Rejected", tone: "danger" },
];

export const PRODUCT_STATUSES: readonly StatusOption[] = [
  { value: "AVAILABLE", label: "Available", tone: "success" },
  { value: "APPROVAL", label: "On approval", tone: "info" },
  { value: "RESERVED", label: "Reserved", tone: "warning" },
  { value: "SOLD", label: "Sold", tone: "neutral" },
  { value: "REPAIR", label: "In repair", tone: "warning" },
  { value: "RETURNED", label: "Returned", tone: "neutral" },
  { value: "SCRAPPED", label: "Scrapped", tone: "danger" },
];

export const APPROVAL_STATUSES: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "ISSUED", label: "Issued", tone: "info" },
  { value: "PARTIALLY_RETURNED", label: "Partially returned", tone: "warning" },
  { value: "RETURNED", label: "Returned", tone: "neutral" },
  { value: "CONVERTED_TO_SALE", label: "Converted to sale", tone: "success" },
  { value: "CANCELLED", label: "Cancelled", tone: "danger" },
  { value: "EXPIRED", label: "Expired", tone: "danger" },
];

export const INVOICE_STATUSES: readonly StatusOption[] = [
  { value: "DRAFT", label: "Draft", tone: "neutral" },
  { value: "PENDING_PAYMENT", label: "Pending payment", tone: "warning" },
  { value: "PARTIALLY_PAID", label: "Partially paid", tone: "info" },
  { value: "PAID", label: "Paid", tone: "success" },
  { value: "CANCELLED", label: "Cancelled", tone: "danger" },
  { value: "RETURNED", label: "Returned", tone: "neutral" },
];

export const PAYMENT_STATUSES: readonly StatusOption[] = [
  { value: "PENDING", label: "Pending", tone: "warning" },
  { value: "PARTIAL", label: "Partial", tone: "info" },
  { value: "PAID", label: "Paid", tone: "success" },
  { value: "REFUNDED", label: "Refunded", tone: "neutral" },
  { value: "CANCELLED", label: "Cancelled", tone: "danger" },
];

/**
 * Look up a status option regardless of which module it belongs to.
 * Used by the shared <StatusBadge> so a single component can render any
 * status enum in the app.
 */
const ALL_STATUS_LISTS: readonly (readonly StatusOption[])[] = [
  ACTIVE_STATUSES,
  PURCHASE_STATUSES,
  ISSUE_STATUSES,
  RECEIPT_STATUSES,
  PRODUCT_STATUSES,
  APPROVAL_STATUSES,
  INVOICE_STATUSES,
  PAYMENT_STATUSES,
];

export function findStatus(value: string): StatusOption | undefined {
  for (const list of ALL_STATUS_LISTS) {
    const found = list.find((o) => o.value === value);
    if (found) return found;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Editable catalogs
// ---------------------------------------------------------------------------

/**
 * Kinds of user-editable reference data. Add new kinds here as needed.
 * The server-side lookup lives in `lib/reference-data.server.ts`.
 */
export type EditableKind =
  | "jewellery-subcategory"
  | "karigar-specialization"
  | "sale-type"
  | "approval-purpose";

/**
 * Static defaults for each editable kind. `npm run seed:reference-data`
 * inserts these into the `referenceData` collection on first setup.
 */
export const STATIC_EDITABLE_SEED: Readonly<
  Record<EditableKind, readonly Option[]>
> = {
  "jewellery-subcategory": Object.values(JEWELLERY_SUBCATEGORIES).flat(),
  "karigar-specialization": KARIGAR_SPECIALIZATIONS,
  "sale-type": SALE_TYPES,
  "approval-purpose": APPROVAL_PURPOSES,
};

// ---------------------------------------------------------------------------
// Regex helpers used by the smart inputs (Workstream 2)
// ---------------------------------------------------------------------------

/**
 * Indian GSTIN validator: 2-digit state + 10-char PAN + 1 entity code +
 * 1 fixed "Z" + 1 check digit.
 */
export const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

/** Indian PAN: 5 alpha + 4 numeric + 1 alpha. */
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

/** Indian mobile: 10 digits starting 6/7/8/9. */
export const INDIAN_MOBILE_REGEX = /^[6-9][0-9]{9}$/;

/** IFSC: 4 alpha + 0 + 6 alphanumeric. */
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

/** 12-digit Aadhaar. */
export const AADHAAR_REGEX = /^[0-9]{12}$/;

/** 6-digit Indian pincode. */
export const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

/**
 * Extract the state code from a GSTIN's first two digits.
 * Returns null when the code doesn't map to a known state number.
 */
const GST_STATE_NUMBER_TO_CODE: Record<string, string> = {
  "01": "JK", "02": "HP", "03": "PB", "04": "CH", "05": "UT", "06": "HR",
  "07": "DL", "08": "RJ", "09": "UP", "10": "BR", "11": "SK", "12": "AR",
  "13": "NL", "14": "MN", "15": "MZ", "16": "TR", "17": "ML", "18": "AS",
  "19": "WB", "20": "JH", "21": "OR", "22": "CT", "23": "MP", "24": "GJ",
  "26": "DN", "27": "MH", "29": "KA", "30": "GA", "31": "LD", "32": "KL",
  "33": "TN", "34": "PY", "35": "AN", "36": "TG", "37": "AP", "38": "LA",
};

export function stateCodeFromGst(gst: string): string | null {
  const prefix = gst.slice(0, 2);
  return GST_STATE_NUMBER_TO_CODE[prefix] ?? null;
}
