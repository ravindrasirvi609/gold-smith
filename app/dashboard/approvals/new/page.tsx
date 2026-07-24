import { redirect } from "next/navigation";
import { ApprovalForm } from "@/components/sales/approval-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomerOptions, getAvailableProductOptions } from "@/lib/admin-entity-options";

export default async function NewApprovalPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "APPROVAL_CREATE")) redirect("/dashboard/approvals");

  const [customers, products] = await Promise.all([
    getCustomerOptions(),
    getAvailableProductOptions(),
  ]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create approval</h1>
          <p className="text-sm text-muted-foreground">Issue jewellery to a customer on approval.</p>
        </div>
        <ApprovalForm customers={customers} products={products} />
      </div>
    </main>
  );
}
