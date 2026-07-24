"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, MapPin, ShieldCheck, Banknote, Paperclip } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  CountryPicker,
  StatePicker,
  GstInput,
  PanInput,
  MobileInput,
  PincodeInput,
  MoneyInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import {
  VENDOR_TYPES,
  BUSINESS_TYPES,
  PAYMENT_TERMS,
  ACTIVE_STATUSES,
} from "@/lib/reference-data";
import type { VendorFormValues } from "@/lib/admin-vendors";

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  initialValues?: Partial<VendorFormValues>;
  canDelete?: boolean;
};

export function VendorForm({ mode, actionUrl, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(initialValues?.country ?? "IN");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, {
        method: mode === "create" ? "POST" : "PATCH",
        body: new FormData(event.currentTarget),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not save the vendor.");
      toast.success(mode === "create" ? "Vendor created." : "Vendor updated.");
      router.push("/dashboard/vendors");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this vendor? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not delete the vendor.");
      toast.success("Vendor deleted.");
      router.push("/dashboard/vendors");
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

      {/* ── Identity ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Identity"
        description="Basic business identity and status."
        icon={Building2}
        columns={2}
      >
        <FormField label="Vendor type" required>
          <ReferenceSelect
            name="vendorType"
            options={VENDOR_TYPES}
            defaultValue={initialValues?.vendorType ?? "GOLD"}
          />
        </FormField>
        <FormField label="Business type">
          <ReferenceSelect
            name="businessType"
            options={BUSINESS_TYPES}
            includeEmpty
            emptyLabel="Select type"
            defaultValue={initialValues?.businessType ?? ""}
          />
        </FormField>
        <FormField label="Company / firm name" required>
          <Input
            name="companyName"
            defaultValue={initialValues?.companyName ?? ""}
            placeholder="e.g. Mehta Jewels Pvt. Ltd."
          />
        </FormField>
        <FormField label="Owner / proprietor name">
          <Input
            name="ownerName"
            defaultValue={initialValues?.ownerName ?? ""}
            placeholder="e.g. Rajesh Mehta"
          />
        </FormField>
        <FormField label="Website">
          <Input
            name="website"
            type="url"
            defaultValue={initialValues?.website ?? ""}
            placeholder="https://example.com"
          />
        </FormField>
        <FormField label="Status" required>
          <ReferenceSelect
            name="status"
            options={ACTIVE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "ACTIVE"}
          />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea
            name="remarks"
            rows={2}
            defaultValue={initialValues?.remarks ?? ""}
            placeholder="Any notes about this vendor…"
          />
        </FormField>
      </SectionCard>

      {/* ── Contact ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Contact"
        description="Phone, email and address details."
        icon={MapPin}
        columns={2}
      >
        <FormField label="Primary mobile" required>
          <MobileInput name="mobile" defaultValue={initialValues?.mobile ?? ""} />
        </FormField>
        <FormField label="Alternate mobile">
          <MobileInput name="alternateMobile" defaultValue={initialValues?.alternateMobile ?? ""} />
        </FormField>
        <FormField label="Email" className="sm:col-span-2">
          <Input
            name="email"
            type="email"
            defaultValue={initialValues?.email ?? ""}
            placeholder="vendor@example.com"
          />
        </FormField>
        <FormField label="Address" className="sm:col-span-2">
          <Textarea
            name="address"
            rows={2}
            defaultValue={initialValues?.address ?? ""}
            placeholder="Street / building / locality"
          />
        </FormField>
        <FormField label="City">
          <Input name="city" defaultValue={initialValues?.city ?? ""} placeholder="e.g. Mumbai" />
        </FormField>
        <FormField label="Pincode">
          <PincodeInput name="pincode" defaultValue={initialValues?.pincode ?? ""} />
        </FormField>
        <FormField label="Country">
          <CountryPicker
            name="country"
            defaultValue={initialValues?.country ?? "IN"}
            onChange={setCountry}
          />
        </FormField>
        <FormField label="State / province">
          <StatePicker
            name="state"
            country={country}
            defaultValue={initialValues?.state ?? ""}
          />
        </FormField>
      </SectionCard>

      {/* ── KYC / Compliance ───────────────────────────────────────────── */}
      <SectionCard
        title="KYC / Compliance"
        description="Government-issued identifiers required for GST billing."
        icon={ShieldCheck}
        columns={2}
      >
        <FormField label="GST number" hint="15-character GSTIN, e.g. 22AAAAA0000A1Z5">
          <GstInput name="gstNumber" defaultValue={initialValues?.gstNumber ?? ""} />
        </FormField>
        <FormField label="PAN number" hint="10-character PAN, e.g. ABCDE1234F">
          <PanInput name="panNumber" defaultValue={initialValues?.panNumber ?? ""} />
        </FormField>
      </SectionCard>

      {/* ── Financial ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Financial"
        description="Credit terms, opening balance, and bank details."
        icon={Banknote}
        columns={2}
      >
        <FormField label="Payment terms">
          <ReferenceSelect
            name="paymentTerms"
            options={PAYMENT_TERMS}
            includeEmpty
            emptyLabel="Select terms"
            defaultValue={initialValues?.paymentTerms ?? ""}
          />
        </FormField>
        <FormField label="Credit days" hint="0 = cash on delivery">
          <Input
            name="creditDays"
            type="number"
            min="0"
            defaultValue={initialValues?.creditDays ?? "0"}
            placeholder="e.g. 30"
          />
        </FormField>
        <FormField label="Credit limit (₹)" hint="0 = no credit limit">
          <MoneyInput name="creditLimit" defaultValue={initialValues?.creditLimit ?? "0"} />
        </FormField>
        <FormField label="Opening balance (₹)">
          <MoneyInput name="openingBalance" defaultValue={initialValues?.openingBalance ?? "0"} />
        </FormField>
        <FormField label="Bank name">
          <Input name="bankName" defaultValue={initialValues?.bankName ?? ""} placeholder="e.g. HDFC Bank" />
        </FormField>
        <FormField label="IFSC code">
          <Input
            name="ifscCode"
            defaultValue={initialValues?.ifscCode ?? ""}
            placeholder="e.g. HDFC0001234"
            className="uppercase"
            maxLength={11}
          />
        </FormField>
        <FormField label="Account number">
          <Input
            name="accountNumber"
            defaultValue={initialValues?.accountNumber ?? ""}
            placeholder="Bank account number"
          />
        </FormField>
      </SectionCard>

      {/* ── Documents ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Documents"
        description="Logo and compliance documents stored securely."
        icon={Paperclip}
        columns={3}
      >
        <FileUpload
          kind="vendors"
          variant="image"
          name="logoUrl"
          label="Company logo"
          initialUrl={initialValues?.logoUrl}
        />
        <FileUpload
          kind="vendors"
          variant="document"
          name="gstDocUrl"
          label="GST certificate"
          initialUrl={initialValues?.gstDocUrl}
        />
        <FileUpload
          kind="vendors"
          variant="document"
          name="panDocUrl"
          label="PAN card"
          initialUrl={initialValues?.panDocUrl}
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Create vendor" : "Save changes"}
        onCancel={() => router.back()}
        onDelete={mode === "edit" && canDelete ? onDelete : undefined}
        deleteLabel="Delete vendor"
        sticky
      />
    </form>
  );
}
