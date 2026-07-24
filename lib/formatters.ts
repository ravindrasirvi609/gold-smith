/**
 * Shared formatters for money, weight, dates, phone numbers, and codes.
 *
 * All UI consumers should go through these instead of inlining
 * `.toFixed()` or `.toLocaleString()` calls — that way one policy change
 * (say, switching gram precision from 3 to 4 decimals, or moving to
 * lakh/crore grouping) touches exactly one file.
 */

// ---------------------------------------------------------------------------
// Money
// ---------------------------------------------------------------------------

/**
 * Parse a possibly-numeric input into a Number, defaulting to 0. Never
 * throws — accepts strings with commas, currency symbols, or whitespace.
 */
export function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const cleaned = String(value).replace(/[₹$,\s]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

const INR_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/**
 * Format an amount as INR with Indian grouping (lakh, crore).
 * Passing "0" returns "₹0.00" not the empty string — the caller is
 * expected to render an em-dash for missing values themselves.
 */
export function formatINR(value: unknown, options?: { compact?: boolean }): string {
  const n = toNumber(value);
  return options?.compact ? INR_COMPACT.format(n) : INR_FORMATTER.format(n);
}

/** Same as formatINR but returns "—" for zero/empty inputs. */
export function formatINROrDash(value: unknown): string {
  const n = toNumber(value);
  if (n === 0 && !value) return "—";
  return INR_FORMATTER.format(n);
}

// ---------------------------------------------------------------------------
// Weight
// ---------------------------------------------------------------------------

const WEIGHT_UNITS = {
  g: { label: "g", decimals: 3 },
  kg: { label: "kg", decimals: 3 },
  ct: { label: "ct", decimals: 3 },
  pcs: { label: "pcs", decimals: 0 },
} as const;

export type WeightUnit = keyof typeof WEIGHT_UNITS;

/**
 * Format a weight with its unit suffix, at the appropriate precision:
 *   formatWeight("12.345", "g")  → "12.345 g"
 *   formatWeight("2.5", "ct")    → "2.500 ct"
 *   formatWeight(3, "pcs")       → "3 pcs"
 */
export function formatWeight(value: unknown, unit: WeightUnit = "g"): string {
  const spec = WEIGHT_UNITS[unit];
  const n = toNumber(value);
  return `${n.toFixed(spec.decimals)} ${spec.label}`;
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const SHORT_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const LONG_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const DATE_TIME = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export type DateStyle = "short" | "long" | "datetime" | "relative";

/**
 * Format an ISO date string, Date, or timestamp. Returns "—" when the
 * input can't be parsed.
 *
 *   short (default)  → "24 Jul 2026"
 *   long             → "24 July 2026"
 *   datetime         → "24 Jul 2026, 02:15 pm"
 *   relative         → "3 days ago" / "in 2 hours" / "just now"
 */
export function formatDate(
  input: string | number | Date | null | undefined,
  style: DateStyle = "short"
): string {
  if (input == null || input === "") return "—";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";

  switch (style) {
    case "long":
      return LONG_DATE.format(date);
    case "datetime":
      return DATE_TIME.format(date);
    case "relative":
      return formatRelative(date);
    case "short":
    default:
      return SHORT_DATE.format(date);
  }
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function formatRelative(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (abs < minute) return "just now";
  if (abs < hour) return RELATIVE.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return RELATIVE.format(Math.round(diffMs / hour), "hour");
  if (abs < week) return RELATIVE.format(Math.round(diffMs / day), "day");
  if (abs < month) return RELATIVE.format(Math.round(diffMs / week), "week");
  if (abs < year) return RELATIVE.format(Math.round(diffMs / month), "month");
  return RELATIVE.format(Math.round(diffMs / year), "year");
}

// ---------------------------------------------------------------------------
// Phone
// ---------------------------------------------------------------------------

/**
 * Format an Indian mobile as `+91 98765 43210`. Non-Indian numbers are
 * left as-is except for stripping whitespace and grouping in fives.
 */
export function formatIndianMobile(value: unknown): string {
  if (!value) return "";
  const digits = String(value).replace(/\D+/g, "");
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    const rest = digits.slice(2);
    return `+91 ${rest.slice(0, 5)} ${rest.slice(5)}`;
  }
  return String(value).trim();
}

// ---------------------------------------------------------------------------
// Codes — formatting for GST, PAN, IFSC on the fly
// ---------------------------------------------------------------------------

/** Uppercase and strip all whitespace — used by GST/PAN inputs. */
export function normaliseCode(value: unknown): string {
  return String(value ?? "")
    .toUpperCase()
    .replace(/\s+/g, "");
}

/**
 * Split a GSTIN into its 4 semantic groups for readability, without
 * changing the underlying value. Returns the input unchanged if it isn't
 * a full 15-character string.
 */
export function prettyGst(value: unknown): string {
  const clean = normaliseCode(value);
  if (clean.length !== 15) return clean;
  // 22 · AAAAA · 0000 · A · 1 · Z · 5
  return `${clean.slice(0, 2)} ${clean.slice(2, 7)} ${clean.slice(7, 11)} ${clean.slice(11, 14)} ${clean.slice(14)}`;
}

// ---------------------------------------------------------------------------
// Names, initials, joins
// ---------------------------------------------------------------------------

export function fullName(
  first: string | null | undefined,
  last: string | null | undefined
): string {
  return [first, last].filter(Boolean).join(" ").trim();
}

export function joinParts(...parts: Array<string | null | undefined>): string {
  return parts.map((p) => (p ?? "").trim()).filter(Boolean).join(" · ");
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
