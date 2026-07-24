import { redirect } from "next/navigation";
import { PaymentForm } from "@/components/sales/payment-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomerOptions, getInvoiceOptions } from "@/lib/admin-entity-options";

export default async function NewPaymentPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "PAYMENT_CREATE")) redirect("/dashboard/payments");

  const [customers, invoices] = await Promise.all([
    getCustomerOptions(),
    getInvoiceOptions(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Record payment</h1>
          <p className="text-sm text-muted-foreground">Capture a customer payment against an invoice.</p>
        </div>
        <PaymentForm customers={customers} invoices={invoices} />
      </div>
    </main>
  );
}
