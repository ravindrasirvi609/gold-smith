"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, MapPin, Heart, ShieldCheck, Star } from "lucide-react";
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
  DateInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import {
  SALUTATIONS,
  GENDERS,
  MARITAL_STATUSES,
  CUSTOMER_TIERS,
  CONTACT_CHANNELS,
  ACTIVE_STATUSES,
} from "@/lib/reference-data";
import type { CustomerFormValues } from "@/lib/admin-customers";

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  initialValues?: Partial<CustomerFormValues>;
  canDelete?: boolean;
};

export function CustomerForm({ mode, actionUrl, initialValues, canDelete }: Props) {
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
      if (!response.ok) throw new Error(data?.message ?? "Could not save the customer.");
      toast.success(mode === "create" ? "Customer created." : "Customer updated.");
      router.push("/dashboard/customers");
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
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not delete the customer.");
      toast.success("Customer deleted.");
      router.push("/dashboard/customers");
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

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Identity"
        description="Name, tier, and account status."
        icon={User}
        columns={2}
      >
        <FormField label="Salutation">
          <ReferenceSelect
            name="salutation"
            options={SALUTATIONS}
            includeEmpty
            emptyLabel="Select"
            defaultValue={initialValues?.salutation ?? ""}
          />
        </FormField>
        <FormField label="Customer tier">
          <ReferenceSelect
            name="customerTier"
            options={CUSTOMER_TIERS}
            includeEmpty
            emptyLabel="Select tier"
            defaultValue={initialValues?.customerTier ?? ""}
          />
        </FormField>
        <FormField label="First name" required>
          <Input
            name="firstName"
            defaultValue={initialValues?.firstName ?? ""}
            placeholder="e.g. Priya"
          />
        </FormField>
        <FormField label="Last name">
          <Input
            name="lastName"
            defaultValue={initialValues?.lastName ?? ""}
            placeholder="e.g. Sharma"
          />
        </FormField>
        <FormField label="Status" required>
          <ReferenceSelect
            name="status"
            options={ACTIVE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "ACTIVE"}
          />
        </FormField>
        <FormField label="Preferred contact channel">
          <ReferenceSelect
            name="preferredContactChannel"
            options={CONTACT_CHANNELS}
            includeEmpty
            emptyLabel="Select channel"
            defaultValue={initialValues?.preferredContactChannel ?? ""}
          />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea
            name="remarks"
            rows={2}
            defaultValue={initialValues?.remarks ?? ""}
            placeholder="Any notes about this customer…"
          />
        </FormField>
      </SectionCard>

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Contact"
        description="Phone, email, and address."
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
            placeholder="customer@example.com"
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
          <Input name="city" defaultValue={initialValues?.city ?? ""} placeholder="e.g. Delhi" />
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

      {/* ── Personal ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Personal"
        description="Demographics for personalised offers and event reminders."
        icon={Heart}
        columns={2}
      >
        <FormField label="Gender">
          <ReferenceSelect
            name="gender"
            options={GENDERS}
            includeEmpty
            emptyLabel="Select gender"
            defaultValue={initialValues?.gender ?? ""}
          />
        </FormField>
        <FormField label="Marital status">
          <ReferenceSelect
            name="maritalStatus"
            options={MARITAL_STATUSES}
            includeEmpty
            emptyLabel="Select"
            defaultValue={initialValues?.maritalStatus ?? ""}
          />
        </FormField>
        <FormField label="Date of birth" hint="Used for birthday greetings">
          <DateInput name="dob" defaultValue={initialValues?.dob ?? ""} pastOnly />
        </FormField>
        <FormField label="Wedding anniversary">
          <DateInput name="anniversary" defaultValue={initialValues?.anniversary ?? ""} pastOnly />
        </FormField>
      </SectionCard>

      {/* ── KYC ──────────────────────────────────────────────────────── */}
      <SectionCard
        title="KYC"
        description="Tax identifiers for GST billing."
        icon={ShieldCheck}
        columns={2}
      >
        <FormField label="GST number" hint="15-character GSTIN">
          <GstInput name="gstNumber" defaultValue={initialValues?.gstNumber ?? ""} />
        </FormField>
        <FormField label="PAN number" hint="10-character PAN">
          <PanInput name="panNumber" defaultValue={initialValues?.panNumber ?? ""} />
        </FormField>
      </SectionCard>

      {/* ── Documents ────────────────────────────────────────────────── */}
      <SectionCard
        title="Documents"
        description="Customer photo and identity proof."
        icon={Star}
        columns={2}
      >
        <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
          <FileUpload
            kind="customers"
            variant="image"
            name="photoUrl"
            label="Customer photo"
            initialUrl={initialValues?.photoUrl}
          />
          <FileUpload
            kind="customers"
            variant="document"
            name="idProofUrl"
            label="ID proof"
            initialUrl={initialValues?.idProofUrl}
          />
        </div>
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Create customer" : "Save changes"}
        onCancel={() => router.back()}
        onDelete={mode === "edit" && canDelete ? onDelete : undefined}
        deleteLabel="Delete customer"
        sticky
      />
    </form>
  );
}
