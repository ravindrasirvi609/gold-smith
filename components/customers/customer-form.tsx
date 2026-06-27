"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CustomerFormValues } from "@/lib/admin-customers";

type Props = { mode: "create" | "edit"; actionUrl: string; initialValues?: Partial<CustomerFormValues>; canDelete?: boolean };
export function CustomerForm({ mode, actionUrl, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<CustomerFormValues>({
    firstName: initialValues?.firstName ?? "",
    lastName: initialValues?.lastName ?? "",
    gender: initialValues?.gender ?? "",
    dob: initialValues?.dob ?? "",
    anniversary: initialValues?.anniversary ?? "",
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
    remarks: initialValues?.remarks ?? "",
    status: initialValues?.status ?? "ACTIVE",
  });
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    try { const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: new FormData(event.currentTarget) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Could not save the customer."); router.push("/dashboard/customers"); router.refresh(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Something went wrong."); } finally { setLoading(false); }
  }
  async function onDelete() { if (!window.confirm("Delete this customer? This cannot be undone.")) return; setLoading(true); setError(null); try { const response = await fetch(actionUrl, { method: "DELETE" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Could not delete the customer."); router.push("/dashboard/customers"); router.refresh(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Something went wrong."); } finally { setLoading(false); } }
  return (<Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5"><CardHeader><CardTitle className="text-2xl">{mode === "create" ? "Create customer" : "Edit customer"}</CardTitle><CardDescription>Capture the customer details used for approval and billing.</CardDescription></CardHeader><CardContent className="space-y-4">{error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}<form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>{["firstName","lastName","gender","dob","anniversary","mobile","alternateMobile","email","gstNumber","panNumber","city","state","pincode","country"].map((key) => (<div className="space-y-2" key={key}><Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1")}</Label><Input id={key} name={key} value={formValues[key as keyof CustomerFormValues] as string} onChange={(event) => setFormValues((current) => ({ ...current, [key]: event.target.value }))} /></div>))}<div className="space-y-2 md:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formValues.address} onChange={(event) => setFormValues((current) => ({ ...current, address: event.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="remarks">Remarks</Label><Input id="remarks" name="remarks" value={formValues.remarks} onChange={(event) => setFormValues((current) => ({ ...current, remarks: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as CustomerFormValues["status"] }))}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="BLOCKED">BLOCKED</option></select></div><div className="md:col-span-2 flex flex-wrap gap-3"><Button type="submit" disabled={loading}>{loading ? "Saving..." : mode === "create" ? "Create customer" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>{mode === "edit" && canDelete ? <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>Delete customer</Button> : null}</div></form></CardContent></Card>);
}

