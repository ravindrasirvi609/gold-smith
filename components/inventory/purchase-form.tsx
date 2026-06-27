"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type GoldItem = { purity: string; grossWeight: string; pureWeight: string; ratePerGram: string; amount: string };
type DiamondItem = { sieveSize: string; shape: string; color: string; clarity: string; pcs: string; carat: string; ratePerCarat: string; amount: string };

type VendorOption = { id: string; name: string };
type PurchaseItem = Record<string, string>;

type PurchaseInitialValues = {
  vendorId?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  purchaseDate?: string;
  items?: PurchaseItem[];
  gst?: string;
  otherCharges?: string;
  remarks?: string;
  status?: string;
};

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  purchaseType: "gold" | "diamond";
  vendors: VendorOption[];
  initialValues?: PurchaseInitialValues;
  canDelete?: boolean;
};

function emptyGoldItem(): GoldItem { return { purity: "", grossWeight: "", pureWeight: "", ratePerGram: "", amount: "" }; }
function emptyDiamondItem(): DiamondItem { return { sieveSize: "", shape: "", color: "", clarity: "", pcs: "", carat: "", ratePerCarat: "", amount: "" }; }

export function PurchaseForm({ mode, actionUrl, purchaseType, vendors, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<PurchaseItem[]>(
    initialValues?.items?.length
      ? initialValues.items
      : [purchaseType === "gold" ? emptyGoldItem() : emptyDiamondItem()]
  );
  const [formValues, setFormValues] = useState({
    vendorId: initialValues?.vendorId ?? vendors[0]?.id ?? "",
    invoiceNo: initialValues?.invoiceNo ?? "",
    invoiceDate: initialValues?.invoiceDate ?? "",
    purchaseDate: initialValues?.purchaseDate ?? "",
    gst: initialValues?.gst ?? "0",
    otherCharges: initialValues?.otherCharges ?? "0",
    remarks: initialValues?.remarks ?? "",
    status: initialValues?.status ?? "DRAFT",
  });
  const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0) + Number(formValues.gst || 0) + Number(formValues.otherCharges || 0);
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("items", JSON.stringify(items));
      const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Could not save purchase.");
      router.push(purchaseType === "gold" ? "/dashboard/gold-purchases" : "/dashboard/diamond-purchases");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  async function onDelete() { if (!window.confirm("Delete this purchase? This cannot be undone.")) return; setLoading(true); setError(null); try { const response = await fetch(actionUrl, { method: "DELETE" }); const data = await response.json().catch(() => null); if (!response.ok) throw new Error(data?.message || "Could not delete purchase."); router.push(purchaseType === "gold" ? "/dashboard/gold-purchases" : "/dashboard/diamond-purchases"); router.refresh(); } catch (deleteError) { setError(deleteError instanceof Error ? deleteError.message : "Something went wrong."); } finally { setLoading(false); } }
  function updateItem(index: number, key: string, value: string) {
    setItems((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [key]: value, amount: key === "amount" ? value : item.amount } : item
      )
    );
  }
  function addRow() { setItems((current) => [...current, purchaseType === "gold" ? emptyGoldItem() : emptyDiamondItem()]); }
  function removeRow(index: number) { setItems((current) => current.length > 1 ? current.filter((_, i) => i !== index) : current); }
  return (
    <Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-2xl">{mode === "create" ? `Create ${purchaseType} purchase` : `Edit ${purchaseType} purchase`}</CardTitle>
        <CardDescription>Capture the invoice and line items, then write inventory ledger entries automatically.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="vendorId">Vendor</Label><select id="vendorId" name="vendorId" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.vendorId} onChange={(e) => setFormValues((c) => ({ ...c, vendorId: e.target.value }))}>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></div>
            <div className="space-y-2"><Label htmlFor="status">Status</Label><select id="status" name="status" className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formValues.status} onChange={(e) => setFormValues((c) => ({ ...c, status: e.target.value }))}><option value="DRAFT">Draft</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
            <div className="space-y-2"><Label htmlFor="invoiceNo">Invoice no</Label><Input id="invoiceNo" name="invoiceNo" value={formValues.invoiceNo} onChange={(e) => setFormValues((c) => ({ ...c, invoiceNo: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="invoiceDate">Invoice date</Label><Input id="invoiceDate" name="invoiceDate" type="date" value={formValues.invoiceDate} onChange={(e) => setFormValues((c) => ({ ...c, invoiceDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="purchaseDate">Purchase date</Label><Input id="purchaseDate" name="purchaseDate" type="date" value={formValues.purchaseDate} onChange={(e) => setFormValues((c) => ({ ...c, purchaseDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="gst">GST</Label><Input id="gst" name="gst" value={formValues.gst} onChange={(e) => setFormValues((c) => ({ ...c, gst: e.target.value }))} /></div>
            <div className="space-y-2"><Label htmlFor="otherCharges">Other charges</Label><Input id="otherCharges" name="otherCharges" value={formValues.otherCharges} onChange={(e) => setFormValues((c) => ({ ...c, otherCharges: e.target.value }))} /></div>
          </div>
          <input type="hidden" name="items" value={JSON.stringify(items)} />
          <div className="space-y-3 rounded-2xl border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{purchaseType === "gold" ? "Gold items" : "Diamond items"}</h3>
              <Button type="button" variant="outline" onClick={addRow}>Add row</Button>
            </div>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid gap-3 rounded-xl border p-3 md:grid-cols-5">
                  {purchaseType === "gold" ? (
                    <>
                      {["purity","grossWeight","pureWeight","ratePerGram","amount"].map((key) => <Input key={key} placeholder={key} value={item[key]} onChange={(e) => updateItem(index, key, e.target.value)} />)}
                    </>
                  ) : (
                    <>
                      {["sieveSize","shape","color","clarity","pcs","carat","ratePerCarat","amount"].map((key) => <Input key={key} placeholder={key} value={item[key]} onChange={(e) => updateItem(index, key, e.target.value)} />)}
                    </>
                  )}
                  <div className="md:col-span-full flex justify-end">
                    <Button type="button" variant="outline" onClick={() => removeRow(index)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label htmlFor="remarks">Remarks</Label><Input id="remarks" name="remarks" value={formValues.remarks} onChange={(e) => setFormValues((c) => ({ ...c, remarks: e.target.value }))} /></div>
          <div className="rounded-xl border bg-muted/40 p-4 text-sm">Estimated total: <span className="font-medium">{total.toFixed(2)}</span></div>
          <div className="flex flex-wrap gap-3"><Button type="submit" disabled={loading}>{loading ? "Saving..." : mode === "create" ? "Create purchase" : "Save changes"}</Button><Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>{mode === "edit" && canDelete ? <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>Delete purchase</Button> : null}</div>
        </form>
      </CardContent>
    </Card>
  );
}
