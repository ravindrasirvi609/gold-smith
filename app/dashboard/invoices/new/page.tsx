import { redirect } from "next/navigation";
import { InvoiceForm } from "@/components/sales/invoice-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomerOptions, getAvailableProductOptions } from "@/lib/admin-entity-options";

export default async function NewInvoicePage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "INVOICE_CREATE")) redirect("/dashboard/invoices");

  const [customers, products] = await Promise.all([
    getCustomerOptions(),
    getAvailableProductOptions(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create invoice</h1>
          <p className="text-sm text-muted-foreground">Sell jewellery and record the invoice.</p>
        </div>
        <InvoiceForm customers={customers} products={products} />
      </div>
    </main>
  );
}
