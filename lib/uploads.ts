import { ulid } from "ulid";

export type UploadKind =
  | "vendors"
  | "customers"
  | "karigars"
  | "users"
  | "products"
  | "gold-purchases"
  | "diamond-purchases"
  | "invoices"
  | "payments"
  | "karigar-issues"
  | "karigar-receipts";

export type UploadedFile = {
  url: string;
  key: string;
  name: string;
  size: number;
  mime: string;
};

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

export function makeObjectKey(kind: UploadKind, mime: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const ext = MIME_EXT[mime] ?? "bin";
  return `${kind}/${yyyy}/${mm}/${ulid()}.${ext}`;
}

export const VALID_KINDS: ReadonlySet<string> = new Set([
  "vendors", "customers", "karigars", "users", "products",
  "gold-purchases", "diamond-purchases", "invoices",
  "payments", "karigar-issues", "karigar-receipts",
]);
