"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreditCard, Building2, Paperclip } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  DateInput,
  MoneyInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import type { EntityOption } from "@/lib/admin-entity-options";

const PAYMENT_TYPE_OPTIONS = [
  { value: "Cash", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "Cheque", label: "Cheque" },
  { value: "RTGS", label: "RTGS" },
  { value: "NEFT", label: "NEFT" },
  { value: "Card", label: "Card" },
  { value: "Bank Transfer", label: "Bank transfer" },
];

type Props = {
  customers: EntityOption[];
  invoices: EntityOption[];
};

export function PaymentForm({ customers, invoices }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState("Cash");

  const needsRef = ["UPI", "Cheque", "RTGS", "NEFT", "Card", "Bank Transfer"].includes(paymentType);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        body: new FormData(event.currentTarget),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not create payment.");
      toast.success("Payment recorded.");
      router.push("/dashboard/payments");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* ── Payment header ──────────────────────────────────────────── */}
      <SectionCard
        title="Payment details"
        description="Customer, invoice, amount, and payment method."
        icon={CreditCard}
        columns={2}
      >
        <FormField label="Customer" required>
          <select
            name="customerId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue=""
          >
            <option value="" disabled>Select a customer</option>
            {customers.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Invoice" required hint="Select the invoice this payment is for">
          <select
            name="invoiceId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue=""
          >
            <option value="" disabled>Select an invoice</option>
            {invoices.map((inv) => (
              <option key={inv.value} value={inv.value}>{inv.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Payment date" required>
          <DateInput name="paymentDate" defaultValue={new Date().toISOString().slice(0, 10)} pastOnly />
        </FormField>
        <FormField label="Payment type" required>
          <ReferenceSelect
            name="paymentType"
            options={PAYMENT_TYPE_OPTIONS}
            value={paymentType}
            onChange={(e) => setPaymentType(e.target.value)}
          />
        </FormField>
        <FormField label="Amount (₹)" required className="sm:col-span-2">
          <MoneyInput name="amount" defaultValue="0" />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea name="remarks" rows={2} placeholder="Any notes about this payment…" />
        </FormField>
      </SectionCard>

      {/* ── Bank / reference ─────────────────────────────────────────── */}
      {needsRef && (
        <SectionCard
          title="Bank / reference details"
          description="Transaction reference for non-cash payments."
          icon={Building2}
          columns={2}
        >
          <FormField label="Transaction ID / UTR">
            <Input name="transactionId" placeholder="e.g. UPI ref, UTR number" />
          </FormField>
          <FormField label="Reference number">
            <Input name="referenceNumber" placeholder="Cheque number, NEFT ref…" />
          </FormField>
          <FormField label="Bank name" className="sm:col-span-2">
            <Input name="bankName" placeholder="e.g. HDFC Bank" />
          </FormField>
        </SectionCard>
      )}

      {/* ── Attachment ───────────────────────────────────────────────── */}
      <SectionCard
        title="Attachment"
        description="Cheque scan, UPI screenshot, or bank receipt."
        icon={Paperclip}
        columns={1}
      >
        <FileUpload
          kind="payments"
          variant="image"
          name="attachmentUrl"
          label="Payment proof"
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel="Record payment"
        onCancel={() => router.push("/dashboard/payments")}
        sticky
      />
    </form>
  );
}
