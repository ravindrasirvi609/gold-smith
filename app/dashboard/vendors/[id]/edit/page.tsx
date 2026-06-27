import { notFound, redirect } from "next/navigation";
import { VendorForm } from "@/components/vendors/vendor-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getVendorById } from "@/lib/admin-vendors";

type PageProps = { params: Promise<{ id: string }> };
export default async function EditVendorPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_EDIT")) redirect("/dashboard/vendors");
  const { id } = await params;
  const vendor = await getVendorById(id);
  if (!vendor) notFound();
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><VendorForm mode="edit" actionUrl={`/api/vendors/${id}`} initialValues={vendor} canDelete={hasPermission(session, "VENDOR_DELETE")} /></div></div></main>;
}

