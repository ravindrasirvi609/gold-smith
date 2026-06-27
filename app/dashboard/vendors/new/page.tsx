import { redirect } from "next/navigation";
import { VendorForm } from "@/components/vendors/vendor-form";
import { getSession, hasPermission } from "@/lib/auth";

export default async function NewVendorPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "VENDOR_CREATE")) redirect("/dashboard/vendors");
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10"><div className="w-full"><VendorForm mode="create" actionUrl="/api/vendors" /></div></div></main>;
}

