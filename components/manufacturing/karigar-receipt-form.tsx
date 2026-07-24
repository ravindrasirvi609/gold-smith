"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ClipboardCheck, Gem, Banknote, Paperclip } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  DateInput,
  MoneyInput,
  WeightInput,
  PercentInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import {
  JEWELLERY_CATEGORIES,
  GOLD_PURITY,
  MAKING_CHARGE_BASIS,
  RECEIPT_STATUSES,
} from "@/lib/reference-data";

type IssueOption = { id: string; issueNo: string };

type DiamondEntry = { sieveSize: string; pcs: string; carat: string };

type JewelItem = {
  category: string;
  subCategory: string;
  productName: string;
  quantity: string;
  grossWeight: string;
  netWeight: string;
  purity: string;
  wastage: string;
  makingCharge: string;
  makingBasis: string;
  diamond: DiamondEntry[];
  remarks: string;
};

function emptyJewel(): JewelItem {
  return {
    category: "",
    subCategory: "",
    productName: "",
    quantity: "1",
    grossWeight: "",
    netWeight: "",
    purity: "916",
    wastage: "0",
    makingCharge: "",
    makingBasis: "PER_GRAM",
    diamond: [],
    remarks: "",
  };
}

type Props = {
  mode?: "create" | "edit";
  actionUrl: string;
  method?: "POST" | "PATCH";
  issues: IssueOption[];
  initialValues?: {
    issueId?: string;
    receiveDate?: string;
    labourCharge?: string;
    labourType?: string;
    jewellery?: unknown[];
    status?: string;
    signedReceiptUrl?: string;
  };
};

export function KarigarReceiptForm({
  mode = "create",
  actionUrl,
  method = "POST",
  issues,
  initialValues,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jewels, setJewels] = useState<JewelItem[]>(() => {
    if (initialValues?.jewellery?.length) {
      return initialValues.jewellery as JewelItem[];
    }
    return [emptyJewel()];
  });

  function updateJewel(index: number, key: keyof JewelItem, value: string) {
    setJewels((current) =>
      current.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    );
  }

  function addDiamond(jewelIdx: number) {
    setJewels((current) =>
      current.map((item, i) =>
        i === jewelIdx
          ? { ...item, diamond: [...item.diamond, { sieveSize: "", pcs: "1", carat: "" }] }
          : item
      )
    );
  }

  function updateDiamond(jewelIdx: number, diamIdx: number, key: keyof DiamondEntry, value: string) {
    setJewels((current) =>
      current.map((item, i) =>
        i === jewelIdx
          ? {
              ...item,
              diamond: item.diamond.map((d, di) => (di === diamIdx ? { ...d, [key]: value } : d)),
            }
          : item
      )
    );
  }

  function removeDiamond(jewelIdx: number, diamIdx: number) {
    setJewels((current) =>
      current.map((item, i) =>
        i === jewelIdx
          ? { ...item, diamond: item.diamond.filter((_, di) => di !== diamIdx) }
          : item
      )
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("jewellery", JSON.stringify(jewels));
      const response = await fetch(actionUrl, { method, body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not save receipt.");
      toast.success(mode === "create" ? "Karigar receipt created." : "Karigar receipt updated.");
      router.push("/dashboard/manufacturing/receipts");
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

      {/* ── Receipt header ──────────────────────────────────────────── */}
      <SectionCard
        title="Receipt header"
        description="Issue reference, receive date, and status."
        icon={ClipboardCheck}
        columns={2}
      >
        {mode === "create" ? (
          <FormField label="Issue" required>
            <select
              name="issueId"
              defaultValue={initialValues?.issueId ?? ""}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select issue</option>
              {issues.map((issue) => (
                <option key={issue.id} value={issue.id}>{issue.issueNo}</option>
              ))}
            </select>
          </FormField>
        ) : null}
        <FormField label="Receive date" required>
          <DateInput name="receiveDate" defaultValue={initialValues?.receiveDate ?? ""} pastOnly />
        </FormField>
        <FormField label="Status">
          <ReferenceSelect
            name="status"
            options={RECEIPT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "PENDING"}
          />
        </FormField>
      </SectionCard>

      {/* ── Labour ──────────────────────────────────────────────────── */}
      <SectionCard
        title="Labour"
        description="Making charge and payment basis."
        icon={Banknote}
        columns={2}
      >
        <FormField label="Labour charge (₹)">
          <MoneyInput name="labourCharge" defaultValue={initialValues?.labourCharge ?? ""} />
        </FormField>
        <FormField label="Labour basis">
          <ReferenceSelect
            name="labourType"
            options={MAKING_CHARGE_BASIS}
            includeEmpty
            emptyLabel="Select basis"
            defaultValue={initialValues?.labourType ?? ""}
          />
        </FormField>
      </SectionCard>

      {/* ── Jewellery items ─────────────────────────────────────────── */}
      <SectionCard
        title="Jewellery items"
        description="Finished pieces returned by the karigar."
        icon={Gem}
        headerRight={
          <Button type="button" size="sm" variant="outline" onClick={() => setJewels((c) => [...c, emptyJewel()])}>
            <Plus className="mr-1 size-4" /> Add item
          </Button>
        }
      >
        <div className="sm:col-span-2 space-y-4">
          {jewels.map((jewel, idx) => (
            <div key={idx} className="rounded-xl border p-4 space-y-4">
              {/* row 1: identity */}
              <div className="grid gap-3 sm:grid-cols-3">
                <FormField label="Category" required>
                  <ReferenceSelect
                    name={`item-category-${idx}`}
                    options={JEWELLERY_CATEGORIES}
                    includeEmpty
                    emptyLabel="Select category"
                    value={jewel.category}
                    onChange={(e) => updateJewel(idx, "category", e.target.value)}
                  />
                </FormField>
                <FormField label="Sub-category">
                  <Input
                    value={jewel.subCategory}
                    onChange={(e) => updateJewel(idx, "subCategory", e.target.value)}
                    placeholder="e.g. Solitaire, Engagement…"
                  />
                </FormField>
                <FormField label="Product name" required>
                  <Input
                    value={jewel.productName}
                    onChange={(e) => updateJewel(idx, "productName", e.target.value)}
                    placeholder="e.g. Diamond solitaire ring"
                  />
                </FormField>
              </div>

              {/* row 2: weight + purity */}
              <div className="grid gap-3 sm:grid-cols-5">
                <FormField label="Qty">
                  <Input
                    type="number"
                    min="1"
                    value={jewel.quantity}
                    onChange={(e) => updateJewel(idx, "quantity", e.target.value)}
                  />
                </FormField>
                <FormField label="Gross wt (g)">
                  <WeightInput
                    name={`jewel-gross-${idx}`}
                    unit="g"
                    value={jewel.grossWeight}
                    onValueChange={(v) => updateJewel(idx, "grossWeight", v)}
                  />
                </FormField>
                <FormField label="Net wt (g)">
                  <WeightInput
                    name={`jewel-net-${idx}`}
                    unit="g"
                    value={jewel.netWeight}
                    onValueChange={(v) => updateJewel(idx, "netWeight", v)}
                  />
                </FormField>
                <FormField label="Purity">
                  <ReferenceSelect
                    name={`item-purity-${idx}`}
                    options={GOLD_PURITY}
                    value={jewel.purity}
                    onChange={(e) => updateJewel(idx, "purity", e.target.value)}
                  />
                </FormField>
                <FormField label="Wastage %">
                  <PercentInput
                    name={`jewel-wastage-${idx}`}
                    value={jewel.wastage}
                    onValueChange={(v) => updateJewel(idx, "wastage", v)}
                  />
                </FormField>
              </div>

              {/* row 3: making charge */}
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Making charge (₹)">
                  <MoneyInput
                    name={`jewel-making-${idx}`}
                    value={jewel.makingCharge}
                    onValueChange={(v) => updateJewel(idx, "makingCharge", v)}
                  />
                </FormField>
                <FormField label="Making basis">
                  <ReferenceSelect
                    name={`item-making-basis-${idx}`}
                    options={MAKING_CHARGE_BASIS}
                    value={jewel.makingBasis}
                    onChange={(e) => updateJewel(idx, "makingBasis", e.target.value)}
                  />
                </FormField>
              </div>

              {/* diamonds */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Diamonds</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => addDiamond(idx)}>
                    <Plus className="mr-1 size-3.5" /> Add stone
                  </Button>
                </div>
                {jewel.diamond.map((d, di) => (
                  <div key={di} className="grid gap-2 sm:grid-cols-4 rounded-lg bg-muted/40 p-2">
                    <FormField label="Sieve">
                      <Input
                        value={d.sieveSize}
                        onChange={(e) => updateDiamond(idx, di, "sieveSize", e.target.value)}
                        placeholder="+8"
                      />
                    </FormField>
                    <FormField label="Pcs">
                      <Input
                        type="number"
                        min="1"
                        value={d.pcs}
                        onChange={(e) => updateDiamond(idx, di, "pcs", e.target.value)}
                      />
                    </FormField>
                    <FormField label="Carat (ct)">
                      <WeightInput
                        name={`jewel-d-carat-${idx}-${di}`}
                        unit="ct"
                        value={d.carat}
                        onValueChange={(v) => updateDiamond(idx, di, "carat", v)}
                      />
                    </FormField>
                    <div className="flex items-end pb-0.5">
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeDiamond(idx, di)} className="text-destructive hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <FormField label="Item remarks">
                <Textarea
                  rows={1}
                  value={jewel.remarks}
                  onChange={(e) => updateJewel(idx, "remarks", e.target.value)}
                  placeholder="Hallmarking, polishing notes…"
                />
              </FormField>

              {jewels.length > 1 && (
                <div className="flex justify-end border-t pt-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setJewels((c) => c.filter((_, i) => i !== idx))}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 size-3.5" /> Remove item
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Documents ───────────────────────────────────────────────── */}
      <SectionCard
        title="Documents"
        description="Signed receipt and product photo."
        icon={Paperclip}
        columns={2}
      >
        <FileUpload
          kind="karigar-receipts"
          variant="document"
          name="signedReceiptUrl"
          label="Signed receipt"
          initialUrl={initialValues?.signedReceiptUrl}
        />
        <FileUpload
          kind="karigar-receipts"
          variant="image"
          name="productImageUrl"
          label="Product photo (all items)"
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Save receipt" : "Save changes"}
        onCancel={() => router.back()}
        sticky
      />
    </form>
  );
}
