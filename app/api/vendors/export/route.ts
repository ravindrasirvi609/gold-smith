import { getSession, hasPermission } from "@/lib/auth";
import { getVendors } from "@/lib/admin-vendors";
import { csvResponse, timestampSlug, toCsv } from "@/lib/csv";
import { parseListQuery } from "@/lib/list-query";
import { NextResponse } from "next/server";

/**
 * GET /api/vendors/export
 *
 * Streams the current filtered vendor list as CSV. Reuses the same
 * URL-driven query params as the list page — pass `?q=...&status=...`
 * to export the same rows currently shown.
 */
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_VIEW")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(searchParams, { defaultPageSize: 5000 });
  // Cap at 20 000 for export to avoid runaway payloads.
  query.pageSize = Math.min(query.pageSize, 20_000);
  query.limit = query.pageSize;
  query.skip = 0;

  const result = await getVendors(query);
  const csv = toCsv(result.items, [
    { header: "Code", value: (v) => v.vendorCode },
    { header: "Type", value: (v) => v.vendorType },
    { header: "Company", value: (v) => v.companyName },
    { header: "Owner", value: (v) => v.ownerName },
    { header: "Mobile", value: (v) => v.mobile },
    { header: "GST", value: (v) => v.gstNumber },
    { header: "Status", value: (v) => v.status },
    { header: "Created", value: (v) => v.createdAt },
  ]);
  return csvResponse(`vendors_${timestampSlug()}.csv`, csv);
}
