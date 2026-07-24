"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ShoppingCart, List, Calculator } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  DateInput,
  MoneyInput,
  WeightInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "@/components/ui/file-upload";
import {
  GOLD_PURITY,
  PURCHASE_STATUSES,
  DIAMOND_SHAPES,
  DIAMOND_COLOURS,
  DIAMOND_CLARITY,
  DIAMOND_SIEVES,
} from "@/lib/reference-data";
import { formatINR } from "@/lib/formatters";

type GoldItem = {
  purity: string;
  grossWeight: string;
  pureWeight: string;
  ratePerGram: string;
  amount: string;
};

type DiamondItem = {
  sieveSize: string;
  shape: string;
  color: string;
  clarity: string;
  pcs: string;
  carat: string;
  ratePerCarat: string;
  amount: string;
};

type VendorOption = { id: string; name: string };

type PurchaseInitialValues = {
  vendorId?: string;
  invoiceNo?: string;
  invoiceDate?: string;
  purchaseDate?: string;
  items?: Record<string, string>[];
  gst?: string;
  otherCharges?: string;
  remarks?: string;
  status?: string;
  invoiceFileUrl?: string;
};

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  purchaseType: "gold" | "diamond";
  vendors: VendorOption[];
  initialValues?: PurchaseInitialValues;
  canDelete?: boolean;
};

function emptyGold(): GoldItem {
  return { purity: "916", grossWeight: "", pureWeight: "", ratePerGram: "", amount: "" };
}
function emptyDiamond(): DiamondItem {
  return { sieveSize: "", shape: "", color: "", clarity: "", pcs: "1", carat: "", ratePerCarat: "", amount: "" };
}

type Item = GoldItem | DiamondItem;

export function PurchaseForm({ mode, actionUrl, purchaseType, vendors, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>(
    initialValues?.items?.length
      ? (initialValues.items as Item[])
      : [purchaseType === "gold" ? emptyGold() : emptyDiamond()]
  );
  const [gst, setGst] = useState(initialValues?.gst ?? "0");
  const [otherCharges, setOtherCharges] = useState(initialValues?.otherCharges ?? "0");

  const itemsTotal = items.reduce((sum, item) => sum + Number((item as GoldItem).amount || 0), 0);
  const grandTotal = itemsTotal + Number(gst || 0) + Number(otherCharges || 0);

  function updateItem(index: number, key: string, value: string) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function removeRow(index: number) {
    setItems((current) => (current.length > 1 ? current.filter((_, i) => i !== index) : current));
  }

  function addRow() {
    setItems((current) => [...current, purchaseType === "gold" ? emptyGold() : emptyDiamond()]);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("items", JSON.stringify(items));
      const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not save purchase.");
      toast.success(mode === "create" ? "Purchase created." : "Purchase updated.");
      router.push(purchaseType === "gold" ? "/dashboard/gold-purchases" : "/dashboard/diamond-purchases");
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
    if (!window.confirm("Delete this purchase? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not delete purchase.");
      toast.success("Purchase deleted.");
      router.push(purchaseType === "gold" ? "/dashboard/gold-purchases" : "/dashboard/diamond-purchases");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const backPath = purchaseType === "gold" ? "/dashboard/gold-purchases" : "/dashboard/diamond-purchases";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Purchase header"
        description="Vendor, invoice reference, and purchase date."
        icon={ShoppingCart}
        columns={2}
      >
        <FormField label="Vendor" required>
          <select
            name="vendorId"
            defaultValue={initialValues?.vendorId ?? vendors[0]?.id ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <ReferenceSelect
            name="status"
            options={PURCHASE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "DRAFT"}
          />
        </FormField>
        <FormField label="Invoice number">
          <Input
            name="invoiceNo"
            defaultValue={initialValues?.invoiceNo ?? ""}
            placeholder="e.g. INV-2024-001"
          />
        </FormField>
        <FormField label="Invoice date">
          <DateInput name="invoiceDate" defaultValue={initialValues?.invoiceDate ?? ""} pastOnly />
        </FormField>
        <FormField label="Purchase date">
          <DateInput name="purchaseDate" defaultValue={initialValues?.purchaseDate ?? ""} pastOnly />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea
            name="remarks"
            rows={2}
            defaultValue={initialValues?.remarks ?? ""}
            placeholder="Any notes about this purchase…"
          />
        </FormField>
        <div className="sm:col-span-2">
          <FileUpload
            kind={purchaseType === "gold" ? "gold-purchases" : "diamond-purchases"}
            variant="document"
            name="invoiceFileUrl"
            label="Invoice scan / attachment"
            initialUrl={initialValues?.invoiceFileUrl}
          />
        </div>
      </SectionCard>

      {/* ── Line items ──────────────────────────────────────────────── */}
      <SectionCard
        title={purchaseType === "gold" ? "Gold items" : "Diamond items"}
        description={
          purchaseType === "gold"
            ? "One row per purity / lot. Weights in grams."
            : "One row per sieve / quality lot."
        }
        icon={List}
        headerRight={
          <Button type="button" size="sm" variant="outline" onClick={addRow}>
            <Plus className="mr-1 size-4" /> Add row
          </Button>
        }
      >
        <div className="sm:col-span-2 space-y-3">
          {purchaseType === "gold"
            ? (items as GoldItem[]).map((item, idx) => (
                <GoldItemRow
                  key={idx}
                  item={item}
                  index={idx}
                  canRemove={items.length > 1}
                  onChange={updateItem}
                  onRemove={removeRow}
                />
              ))
            : (items as DiamondItem[]).map((item, idx) => (
                <DiamondItemRow
                  key={idx}
                  item={item}
                  index={idx}
                  canRemove={items.length > 1}
                  onChange={updateItem}
                  onRemove={removeRow}
                />
              ))}
        </div>
      </SectionCard>

      {/* ── Charges & total ─────────────────────────────────────────── */}
      <SectionCard
        title="Charges"
        description="Additional charges added to the purchase total."
        icon={Calculator}
        columns={2}
      >
        <FormField label="GST amount (₹)">
          <MoneyInput
            name="gst"
            value={gst}
            onValueChange={setGst}
          />
        </FormField>
        <FormField label="Other charges (₹)">
          <MoneyInput
            name="otherCharges"
            value={otherCharges}
            onValueChange={setOtherCharges}
          />
        </FormField>
        <div className="sm:col-span-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Items subtotal</span>
            <span>{formatINR(itemsTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">GST</span>
            <span>{formatINR(Number(gst || 0))}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Other charges</span>
            <span>{formatINR(Number(otherCharges || 0))}</span>
          </div>
          <div className="mt-2 flex justify-between border-t pt-2 font-semibold">
            <span>Grand total</span>
            <span>{formatINR(grandTotal)}</span>
          </div>
        </div>
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? `Create ${purchaseType} purchase` : "Save changes"}
        onCancel={() => router.push(backPath)}
        onDelete={mode === "edit" && canDelete ? onDelete : undefined}
        deleteLabel="Delete purchase"
        sticky
      />
    </form>
  );
}

// ── Row sub-components ────────────────────────────────────────────────────────

function GoldItemRow({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  item: GoldItem;
  index: number;
  canRemove: boolean;
  onChange: (index: number, key: string, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-5">
        <FormField label="Purity">
          <ReferenceSelect
            name={`gold-purity-${index}`}
            options={GOLD_PURITY}
            value={item.purity}
            onChange={(e) => onChange(index, "purity", e.target.value)}
          />
        </FormField>
        <FormField label="Gross wt (g)">
          <WeightInput
            name={`gold-gross-${index}`}
            unit="g"
            value={item.grossWeight}
            onValueChange={(v) => onChange(index, "grossWeight", v)}
          />
        </FormField>
        <FormField label="Pure wt (g)">
          <WeightInput
            name={`gold-pure-${index}`}
            unit="g"
            value={item.pureWeight}
            onValueChange={(v) => onChange(index, "pureWeight", v)}
          />
        </FormField>
        <FormField label="Rate / g (₹)">
          <MoneyInput
            name={`gold-rate-${index}`}
            value={item.ratePerGram}
            onValueChange={(v) => onChange(index, "ratePerGram", v)}
          />
        </FormField>
        <FormField label="Amount (₹)">
          <MoneyInput
            name={`gold-amt-${index}`}
            value={item.amount}
            onValueChange={(v) => onChange(index, "amount", v)}
          />
        </FormField>
      </div>
      {canRemove && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 size-3.5" /> Remove
          </Button>
        </div>
      )}
    </div>
  );
}

function DiamondItemRow({
  item,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  item: DiamondItem;
  index: number;
  canRemove: boolean;
  onChange: (index: number, key: string, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        <FormField label="Sieve size">
          <ReferenceSelect
            name={`diamond-sieve-${index}`}
            options={DIAMOND_SIEVES}
            includeEmpty
            emptyLabel="Select"
            value={item.sieveSize}
            onChange={(e) => onChange(index, "sieveSize", e.target.value)}
          />
        </FormField>
        <FormField label="Shape">
          <ReferenceSelect
            name={`diamond-shape-${index}`}
            options={DIAMOND_SHAPES}
            includeEmpty
            emptyLabel="Select"
            value={item.shape}
            onChange={(e) => onChange(index, "shape", e.target.value)}
          />
        </FormField>
        <FormField label="Colour">
          <ReferenceSelect
            name={`diamond-color-${index}`}
            options={DIAMOND_COLOURS}
            includeEmpty
            emptyLabel="Select"
            value={item.color}
            onChange={(e) => onChange(index, "color", e.target.value)}
          />
        </FormField>
        <FormField label="Clarity">
          <ReferenceSelect
            name={`diamond-clarity-${index}`}
            options={DIAMOND_CLARITY}
            includeEmpty
            emptyLabel="Select"
            value={item.clarity}
            onChange={(e) => onChange(index, "clarity", e.target.value)}
          />
        </FormField>
        <FormField label="Pcs">
          <Input
            type="number"
            min="1"
            value={item.pcs}
            onChange={(e) => onChange(index, "pcs", e.target.value)}
          />
        </FormField>
        <FormField label="Carat (ct)">
          <WeightInput
            name={`diamond-carat-${index}`}
            unit="ct"
            value={item.carat}
            onValueChange={(v) => onChange(index, "carat", v)}
          />
        </FormField>
        <FormField label="Rate / ct (₹)">
          <MoneyInput
            name={`diamond-rate-${index}`}
            value={item.ratePerCarat}
            onValueChange={(v) => onChange(index, "ratePerCarat", v)}
          />
        </FormField>
        <FormField label="Amount (₹)">
          <MoneyInput
            name={`diamond-amt-${index}`}
            value={item.amount}
            onValueChange={(v) => onChange(index, "amount", v)}
          />
        </FormField>
      </div>
      {canRemove && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-1 size-3.5" /> Remove
          </Button>
        </div>
      )}
    </div>
  );
}
