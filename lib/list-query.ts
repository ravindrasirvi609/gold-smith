import type { Filter, Sort } from "mongodb";

/**
 * Shared helpers for server-driven list pages.
 *
 * Every list page reads its filter/pagination/sort state from URL search
 * params so links, refreshes, and browser history all work as expected.
 * These helpers normalise that parsing and hand back a { filter, sort,
 * skip, limit, page } tuple ready to feed into a MongoDB query.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 200;

export type ListQuery = {
  page: number;          // 1-indexed
  pageSize: number;
  skip: number;
  limit: number;
  search: string;        // trimmed, may be ""
  sortField: string;     // caller decides which are valid
  sortDir: 1 | -1;
  status: string;        // trimmed, may be "" (== all)
  from: string;          // ISO date, may be ""
  to: string;            // ISO date, may be ""
};

export type ParseOptions = {
  defaultSort?: { field: string; dir: 1 | -1 };
  defaultPageSize?: number;
};

/**
 * Parse a Next.js searchParams object into a canonical ListQuery. Unknown
 * keys are ignored; malformed values fall back to safe defaults.
 */
export function parseListQuery(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams,
  opts: ParseOptions = {}
): ListQuery {
  const read = (key: string): string => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) ?? "";
    }
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  const page = Math.max(1, parseInt(read("page") || "1", 10) || 1);
  const rawSize =
    parseInt(read("pageSize") || String(opts.defaultPageSize ?? DEFAULT_PAGE_SIZE), 10) ||
    opts.defaultPageSize ||
    DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));

  const sortField = (read("sort") || opts.defaultSort?.field || "createdAt").trim();
  const sortDir: 1 | -1 =
    (read("dir") || (opts.defaultSort?.dir === 1 ? "asc" : "desc")).toLowerCase() === "asc"
      ? 1
      : -1;

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    limit: pageSize,
    search: read("q").trim(),
    sortField,
    sortDir,
    status: read("status").trim(),
    from: read("from").trim(),
    to: read("to").trim(),
  };
}

/**
 * Escape a string for safe inclusion in a MongoDB $regex query.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build a case-insensitive $or filter across the given fields for a
 * search term. Returns undefined when the term is empty.
 */
export function textSearchFilter(
  term: string,
  fields: string[]
): Filter<Record<string, unknown>> | undefined {
  if (!term || !fields.length) return undefined;
  const pattern = { $regex: escapeRegex(term), $options: "i" };
  return { $or: fields.map((field) => ({ [field]: pattern })) };
}

/**
 * Combine an arbitrary set of optional filter fragments into a single
 * mongodb Filter. Undefined fragments are dropped so callers can inline
 * conditional builders without a bunch of if-statements.
 */
export function andFilters(
  ...fragments: Array<Filter<Record<string, unknown>> | undefined | null>
): Filter<Record<string, unknown>> {
  const parts = fragments.filter(Boolean) as Filter<Record<string, unknown>>[];
  if (!parts.length) return {};
  if (parts.length === 1) return parts[0]!;
  return { $and: parts };
}

/**
 * Whitelist and construct a MongoDB Sort. Never trust caller input to
 * touch fields that shouldn't be sortable — pass the allow-list.
 */
export function buildSort(
  field: string,
  dir: 1 | -1,
  allowed: readonly string[],
  fallback: string
): Sort {
  const effective = allowed.includes(field) ? field : fallback;
  return { [effective]: dir } as Sort;
}

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

export function paginate<T>(
  items: T[],
  total: number,
  query: ListQuery
): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
    hasPrev: query.page > 1,
    hasNext: query.page < totalPages,
  };
}
