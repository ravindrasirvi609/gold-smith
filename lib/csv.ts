/**
 * CSV export helper.
 *
 * All list-export API routes go through toCsv(rows, columns) to produce a
 * consistent, spreadsheet-safe payload:
 *   - fields are wrapped in double quotes and internal quotes are doubled
 *   - values are coerced to strings and stripped of newlines
 *   - a leading BOM makes Excel open UTF-8 correctly
 *   - a lead-quote is injected before =/+/-/@ so spreadsheets treat those
 *     as text rather than executing them as formulas (CSV-injection safe)
 */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

const FORMULA_LEADS = new Set(["=", "+", "-", "@"]);

function sanitizeCell(input: unknown): string {
  const s = input == null ? "" : String(input);
  const cleaned = s.replace(/\r?\n|\r/g, " ").replace(/\t/g, " ");
  const first = cleaned.charAt(0);
  const injectionSafe = FORMULA_LEADS.has(first) ? `'${cleaned}` : cleaned;
  return `"${injectionSafe.replace(/"/g, '""')}"`;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => sanitizeCell(c.header)).join(",");
  const body = rows
    .map((row) => columns.map((c) => sanitizeCell(c.value(row))).join(","))
    .join("\n");
  // UTF-8 BOM so Excel reads unicode correctly.
  return `﻿${header}\n${body}`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Format YYYY-MM-DD_HH-MM safe for a filename. */
export function timestampSlug(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}
