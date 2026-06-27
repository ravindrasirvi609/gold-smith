import { redirect } from "next/navigation";
import { KarigarReceiptForm } from "@/components/manufacturing/karigar-receipt-form";
import { getSession, hasPermission } from "@/lib/auth";
import { getIssues } from "@/lib/admin-manufacturing";

export default async function NewReceiptPage() {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_CREATE")) redirect("/dashboard/manufacturing/receipts");
  const issues = (await getIssues()).map((issue) => ({ id: issue.id, issueNo: issue.issueNo }));
  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-10"><div className="w-full"><KarigarReceiptForm actionUrl="/api/karigar-receipts" issues={issues} /></div></div></main>;
}

