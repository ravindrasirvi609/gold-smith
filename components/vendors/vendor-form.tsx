"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { VendorFormValues } from "@/lib/admin-vendors";
import { FileUpload } from "@/components/ui/file-upload";

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
  const [formValues, setFormValues] = useState<VendorFormValues>({
    vendorType: initialValues?.vendorType ?? "GOLD",
    companyName: initialValues?.companyName ?? "",
    ownerName: initialValues?.ownerName ?? "",
    mobile: initialValues?.mobile ?? "",
    alternateMobile: initialValues?.alternateMobile ?? "",
    email: initialValues?.email ?? "",
    gstNumber: initialValues?.gstNumber ?? "",
    panNumber: initialValues?.panNumber ?? "",
    address: initialValues?.address ?? "",
    city: initialValues?.city ?? "",
    state: initialValues?.state ?? "",
    pincode: initialValues?.pincode ?? "",
    country: initialValues?.country ?? "India",
    openingBalance: initialValues?.openingBalance ?? "0",
    creditDays: initialValues?.creditDays ?? "0",
    remarks: initialValues?.remarks ?? "",
    status: initialValues?.status ?? "ACTIVE",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Could not save the vendor.");
      toast.success(mode === "create" ? "Vendor created." : "Vendor updated.");
      router.push("/dashboard/vendors");
      router.refresh();
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : "Something went wrong.";
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
      if (!response.ok) throw new Error(data?.message || "Could not delete the vendor.");
      toast.success("Vendor deleted.");
      router.push("/dashboard/vendors");
      router.refresh();
    } catch (deleteError) {
      const msg = deleteError instanceof Error ? deleteError.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-2xl">{mode === "create" ? "Create vendor" : "Edit vendor"}</CardTitle>
        <CardDescription>Keep supplier master data ready for purchasing.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="vendorType">Vendor type</Label>
            <select id="vendorType" name="vendorType" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.vendorType} onChange={(event) => setFormValues((current) => ({ ...current, vendorType: event.target.value as VendorFormValues["vendorType"] }))}>
              <option value="GOLD">Gold</option>
              <option value="DIAMOND">Diamond</option>
              <option value="BOTH">Both</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select id="status" name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as VendorFormValues["status"] }))}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
          {[
            ["companyName", "Company name"],
            ["ownerName", "Owner name"],
            ["mobile", "Mobile"],
            ["alternateMobile", "Alternate mobile"],
            ["email", "Email"],
            ["gstNumber", "GST number"],
            ["panNumber", "PAN number"],
            ["city", "City"],
            ["state", "State"],
            ["pincode", "Pincode"],
            ["country", "Country"],
            ["openingBalance", "Opening balance"],
            ["creditDays", "Credit days"],
          ].map(([key, label]) => (
            <div className="space-y-2" key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} name={key} value={formValues[key as keyof VendorFormValues] as string} onChange={(event) => setFormValues((current) => ({ ...current, [key]: event.target.value }))} />
            </div>
          ))}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" value={formValues.address} onChange={(event) => setFormValues((current) => ({ ...current, address: event.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" name="remarks" value={formValues.remarks} onChange={(event) => setFormValues((current) => ({ ...current, remarks: event.target.value }))} />
          </div>
          <div className="md:col-span-2 grid gap-4 sm:grid-cols-3">
            <FileUpload kind="vendors" variant="image" name="logoUrl" label="Company logo" initialUrl={initialValues?.logoUrl} />
            <FileUpload kind="vendors" variant="document" name="gstDocUrl" label="GST document" initialUrl={initialValues?.gstDocUrl} />
            <FileUpload kind="vendors" variant="document" name="panDocUrl" label="PAN document" initialUrl={initialValues?.panDocUrl} />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : mode === "create" ? "Create vendor" : "Save changes"}</Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
            {mode === "edit" && canDelete ? <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>Delete vendor</Button> : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

