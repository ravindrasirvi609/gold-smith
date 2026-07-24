import { NextResponse } from "next/server";
import { getSession, hasPermission } from "@/lib/auth";
import { getInvoices } from "@/lib/admin-sales";
import { csvResponse, timestampSlug, toCsv } from "@/lib/csv";
import { parseListQuery } from "@/lib/list-query";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_VIEW")) {
    return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }
  const searchParams = new URL(request.url).searchParams;
  const query = parseListQuery(searchParams, { defaultPageSize: 5000 });
  query.pageSize = Math.min(query.pageSize, 20_000);
  query.limit = query.pageSize;
  query.skip = 0;

  const result = await getInvoices(query);
  const csv = toCsv(result.items, [
    { header: "Invoice No", value: (i) => i.invoiceNo },
    { header: "Customer", value: (i) => i.customerName },
    { header: "Date", value: (i) => i.invoiceDate },
    { header: "Sale type", value: (i) => i.saleType },
    { header: "Grand total", value: (i) => i.grandTotal },
    { header: "Payment status", value: (i) => i.paymentStatus },
  ]);
  return csvResponse(`invoices_${timestampSlug()}.csv`, csv);
}
