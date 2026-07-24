"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hammer, MapPin, ShieldCheck, Wrench, Banknote, Paperclip } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  CountryPicker,
  StatePicker,
  AadhaarInput,
  PanInput,
  GstInput,
  MobileInput,
  PincodeInput,
  MoneyInput,
  DateInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import {
  GENDERS,
  KARIGAR_SPECIALIZATIONS,
  SKILL_LEVELS,
  MAKING_CHARGE_BASIS,
  ACTIVE_STATUSES,
} from "@/lib/reference-data";
import type { KarigarFormValues } from "@/lib/admin-karigars";

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  initialValues?: Partial<KarigarFormValues>;
  canDelete?: boolean;
};

export function KarigarForm({ mode, actionUrl, initialValues, canDelete }: Props) {
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
      if (!response.ok) throw new Error(data?.message ?? "Could not save the karigar.");
      toast.success(mode === "create" ? "Karigar created." : "Karigar updated.");
      router.push("/dashboard/karigars");
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
    if (!window.confirm("Delete this karigar? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not delete the karigar.");
      toast.success("Karigar deleted.");
      router.push("/dashboard/karigars");
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
        description="Basic personal details and account status."
        icon={Hammer}
        columns={2}
      >
        <FormField label="Full name" required>
          <Input
            name="name"
            defaultValue={initialValues?.name ?? ""}
            placeholder="e.g. Ramesh Kumar"
          />
        </FormField>
        <FormField label="Father's name">
          <Input
            name="fatherName"
            defaultValue={initialValues?.fatherName ?? ""}
            placeholder="e.g. Suresh Kumar"
          />
        </FormField>
        <FormField label="Gender">
          <ReferenceSelect
            name="gender"
            options={GENDERS}
            includeEmpty
            emptyLabel="Select gender"
            defaultValue={initialValues?.gender ?? ""}
          />
        </FormField>
        <FormField label="Status" required>
          <ReferenceSelect
            name="status"
            options={ACTIVE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "ACTIVE"}
          />
        </FormField>
        <FormField label="Joining date">
          <DateInput name="joiningDate" defaultValue={initialValues?.joiningDate ?? ""} pastOnly />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea
            name="remarks"
            rows={2}
            defaultValue={initialValues?.remarks ?? ""}
            placeholder="Any notes about this karigar…"
          />
        </FormField>
      </SectionCard>

      {/* ── Contact ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Contact"
        description="Phone, email, and residential address."
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
            placeholder="karigar@example.com"
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
          <Input name="city" defaultValue={initialValues?.city ?? ""} placeholder="e.g. Jaipur" />
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

      {/* ── KYC ──────────────────────────────────────────────────────── */}
      <SectionCard
        title="KYC"
        description="Government identifiers for compliance and labour reporting."
        icon={ShieldCheck}
        columns={2}
      >
        <FormField label="Aadhaar number" hint="12-digit unique ID">
          <AadhaarInput name="aadhaar" defaultValue={initialValues?.aadhaar ?? ""} />
        </FormField>
        <FormField label="PAN number" hint="10-character PAN">
          <PanInput name="pan" defaultValue={initialValues?.pan ?? ""} />
        </FormField>
        <FormField label="GST number" hint="Required if karigar is GST-registered">
          <GstInput name="gst" defaultValue={initialValues?.gst ?? ""} />
        </FormField>
      </SectionCard>

      {/* ── Skills ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Skills"
        description="Craft specialization and proficiency."
        icon={Wrench}
        columns={2}
      >
        <FormField label="Specialization">
          <ReferenceSelect
            name="specialization"
            options={KARIGAR_SPECIALIZATIONS}
            includeEmpty
            emptyLabel="Select specialization"
            defaultValue={initialValues?.specialization ?? ""}
          />
        </FormField>
        <FormField label="Skill level">
          <ReferenceSelect
            name="skillLevel"
            options={SKILL_LEVELS}
            includeEmpty
            emptyLabel="Select level"
            defaultValue={initialValues?.skillLevel ?? ""}
          />
        </FormField>
      </SectionCard>

      {/* ── Compensation ─────────────────────────────────────────────── */}
      <SectionCard
        title="Compensation"
        description="Labour rate, balances, and settlement basis."
        icon={Banknote}
        columns={2}
      >
        <FormField label="Labour basis" required>
          <ReferenceSelect
            name="labourType"
            options={MAKING_CHARGE_BASIS}
            defaultValue={initialValues?.labourType ?? "PER_GRAM"}
          />
        </FormField>
        <FormField label="Labour rate (₹)" hint="Per unit based on labour basis above">
          <MoneyInput name="labourRate" defaultValue={initialValues?.labourRate ?? ""} />
        </FormField>
        <FormField label="Opening balance (₹)">
          <MoneyInput name="openingBalance" defaultValue={initialValues?.openingBalance ?? "0"} />
        </FormField>
        <FormField label="Credit balance (₹)">
          <MoneyInput name="creditBalance" defaultValue={initialValues?.creditBalance ?? "0"} />
        </FormField>
      </SectionCard>

      {/* ── Documents ────────────────────────────────────────────────── */}
      <SectionCard
        title="Documents"
        description="Photo and identity documents."
        icon={Paperclip}
        columns={3}
      >
        <FileUpload
          kind="karigars"
          variant="image"
          name="photoUrl"
          label="Photo"
          initialUrl={initialValues?.photoUrl}
        />
        <FileUpload
          kind="karigars"
          variant="document"
          name="aadhaarDocUrl"
          label="Aadhaar card"
          initialUrl={initialValues?.aadhaarDocUrl}
        />
        <FileUpload
          kind="karigars"
          variant="document"
          name="panDocUrl"
          label="PAN card"
          initialUrl={initialValues?.panDocUrl}
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Create karigar" : "Save changes"}
        onCancel={() => router.back()}
        onDelete={mode === "edit" && canDelete ? onDelete : undefined}
        deleteLabel="Delete karigar"
        sticky
      />
    </form>
  );
}
