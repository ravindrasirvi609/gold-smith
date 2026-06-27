"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { KarigarFormValues } from "@/lib/admin-karigars";

type Props = { mode: "create" | "edit"; actionUrl: string; initialValues?: Partial<KarigarFormValues>; canDelete?: boolean };
export function KarigarForm({ mode, actionUrl, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<KarigarFormValues>({
    name: initialValues?.name ?? "",
    fatherName: initialValues?.fatherName ?? "",
    mobile: initialValues?.mobile ?? "",
    alternateMobile: initialValues?.alternateMobile ?? "",
    email: initialValues?.email ?? "",
    aadhaar: initialValues?.aadhaar ?? "",
    pan: initialValues?.pan ?? "",
    gst: initialValues?.gst ?? "",
    address: initialValues?.address ?? "",
    city: initialValues?.city ?? "",
    state: initialValues?.state ?? "",
    pincode: initialValues?.pincode ?? "",
    country: initialValues?.country ?? "India",
    specialization: initialValues?.specialization ?? "",
    labourType: initialValues?.labourType ?? "PER_GRAM",
    labourRate: initialValues?.labourRate ?? "",
    openingBalance: initialValues?.openingBalance ?? "0",
    creditBalance: initialValues?.creditBalance ?? "0",
    joiningDate: initialValues?.joiningDate ?? "",
    remarks: initialValues?.remarks ?? "",
    status: initialValues?.status ?? "ACTIVE",
  });
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(null); try { const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: new FormData(event.currentTarget) }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Could not save the karigar."); router.push("/dashboard/karigars"); router.refresh(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Something went wrong."); } finally { setLoading(false); } }
  async function onDelete() { if (!window.confirm("Delete this karigar? This cannot be undone.")) return; setLoading(true); setError(null); try { const response = await fetch(actionUrl, { method: "DELETE" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Could not delete the karigar."); router.push("/dashboard/karigars"); router.refresh(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Something went wrong."); } finally { setLoading(false); } }
  return (<Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5"><CardHeader><CardTitle className="text-2xl">{mode === "create" ? "Create karigar" : "Edit karigar"}</CardTitle><CardDescription>Track craftsman records for issue, receipt, and labour settlement.</CardDescription></CardHeader><CardContent className="space-y-4">{error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}<form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>{["name","fatherName","mobile","alternateMobile","email","aadhaar","pan","gst","city","state","pincode","country","specialization","labourRate","openingBalance","creditBalance"].map((key) => (<div className="space-y-2" key={key}><Label htmlFor={key}>{key.replace(/([A-Z])/g, " $1")}</Label><Input id={key} name={key} value={formValues[key as keyof KarigarFormValues] as string} onChange={(event) => setFormValues((current) => ({ ...current, [key]: event.target.value }))} /></div>))}<div className="space-y-2"><Label htmlFor="joiningDate">Joining date</Label><Input id="joiningDate" name="joiningDate" type="date" value={formValues.joiningDate} onChange={(event) => setFormValues((current) => ({ ...current, joiningDate: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="labourType">Labour type</Label><select id="labourType" name="labourType" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.labourType} onChange={(event) => setFormValues((current) => ({ ...current, labourType: event.target.value as KarigarFormValues["labourType"] }))}><option value="PER_GRAM">Per gram</option><option value="PER_PIECE">Per piece</option><option value="FIXED">Fixed</option></select></div><div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.status} onChange={(event) => setFormValues((current) => ({ ...current, status: event.target.value as KarigarFormValues["status"] }))}><option value="ACTIVE">ACTIVE</option><option value="INACTIVE">INACTIVE</option><option value="BLOCKED">BLOCKED</option></select></div><div className="space-y-2 md:col-span-2"><Label htmlFor="address">Address</Label><Input id="address" name="address" value={formValues.address} onChange={(event) => setFormValues((current) => ({ ...current, address: event.target.value }))} /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="remarks">Remarks</Label><Input id="remarks" name="remarks" value={formValues.remarks} onChange={(event) => setFormValues((current) => ({ ...current, remarks: event.target.value }))} /></div><div className="md:col-span-2 flex flex-wrap gap-3"><Button type="submit" disabled={loading}>{loading ? "Saving..." : mode === "create" ? "Create karigar" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>{mode === "edit" && canDelete ? <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>Delete karigar</Button> : null}</div></form></CardContent></Card>);
}
