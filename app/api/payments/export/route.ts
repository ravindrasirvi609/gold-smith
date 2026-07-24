import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getPayments } from "@/lib/admin-sales";
import { csvResponse, timestampSlug, toCsv } from "@/lib/csv";
import { parseListQuery } from "@/lib/list-query";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_VIEW")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(searchParams, { defaultPageSize: 5000 });
  query.pageSize = Math.min(query.pageSize, 20_000);
  query.limit = query.pageSize;
  query.skip = 0;

  const result = await getPayments(query);
  const csv = toCsv(result.items, [
    { header: "Payment No", value: (p) => p.paymentNo },
    { header: "Invoice", value: (p) => p.invoiceNo },
    { header: "Customer", value: (p) => p.customerName },
    { header: "Date", value: (p) => p.paymentDate },
    { header: "Type", value: (p) => p.paymentType },
    { header: "Amount", value: (p) => p.amount },
    { header: "Status", value: (p) => p.status },
  ]);
  return csvResponse(`payments_${timestampSlug()}.csv`, csv);
}
