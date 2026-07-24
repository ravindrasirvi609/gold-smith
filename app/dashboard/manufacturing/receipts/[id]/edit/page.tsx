import { notFound, redirect } from "next/navigation";
import { getSession, hasPermission } from "@/lib/auth";
import { getReceiptById } from "@/lib/admin-manufacturing";
import { KarigarReceiptForm } from "@/components/manufacturing/karigar-receipt-form";

type PageProps = { params: Promise<{ id: string }> };

export default async function EditReceiptPage({ params }: PageProps) {
  const session = await getSession();
  if (!session || !hasPermission(session, "RECEIPT_EDIT")) {
    redirect("/dashboard/manufacturing/receipts");
  }
  const { id } = await params;
  const receipt = await getReceiptById(id);
  if (!receipt) notFound();

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-10">
        <div className="w-full">
          <KarigarReceiptForm
            mode="edit"
            method="PATCH"
            actionUrl={`/api/karigar-receipts/${id}`}
            issues={[]}
            initialValues={{
              issueId: receipt.issueId,
              receiveDate: receipt.receiveDate,
              labourCharge: receipt.labourCharge,
              labourType: receipt.labourType,
              jewellery: receipt.jewellery,
              status: receipt.status,
              signedReceiptUrl: receipt.signedReceiptUrl,
            }}
          />
        </div>
      </div>
    </main>
  );
}
