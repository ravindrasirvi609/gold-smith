import { notFound, redirect } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getCustomerById } from "@/lib/admin-customers";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditCustomerPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "CUSTOMER_EDIT")) redirect("/dashboard/customers");
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><CustomerForm mode="edit" actionUrl={`/api/customers/${id}`} initialValues={customer} canDelete={hasPermission(session, "CUSTOMER_DELETE")} /></div></div></main>;
}

