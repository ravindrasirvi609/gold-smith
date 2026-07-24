import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomers } from "@/lib/admin-customers";
import { csvResponse, timestampSlug, toCsv } from "@/lib/csv";
import { parseListQuery } from "@/lib/list-query";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_VIEW")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(searchParams, { defaultPageSize: 5000 });
  query.pageSize = Math.min(query.pageSize, 20_000);
  query.limit = query.pageSize;
  query.skip = 0;

  const result = await getCustomers(query);
  const csv = toCsv(result.items, [
    { header: "Code", value: (c) => c.customerCode },
    { header: "First name", value: (c) => c.firstName },
    { header: "Last name", value: (c) => c.lastName },
    { header: "Mobile", value: (c) => c.mobile },
    { header: "City", value: (c) => c.city },
    { header: "Status", value: (c) => c.status },
  ]);
  return csvResponse(`customers_${timestampSlug()}.csv`, csv);
}
