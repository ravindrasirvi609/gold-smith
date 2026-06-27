import { redirect } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { getSession, hasPermission } from "@/lib/auth";

export default async function NewCustomerPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_CREATE")) redirect("/dashboard/customers");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><CustomerForm mode="create" actionUrl="/api/customers" /></div></div></main>;
}

