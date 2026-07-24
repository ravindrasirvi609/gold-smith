"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Hammer, List, Gem, Paperclip } from "lucide-react";
import { Plus, Trash2 } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  DateInput,
  WeightInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { ISSUE_STATUSES } from "@/lib/reference-data";

type Option = { id: string; name: string; karigarCode?: string };

type GoldRow = { inventoryTransactionId: string; purity: string; grossWeight: string; pureWeight: string };
type DiamondRow = { inventoryTransactionId: string; sieveSize: string; pcs: string; carat: string };

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  karigars: Option[];
  initialValues?: {
    karigarId?: string;
    issueDate?: string;
    designReference?: string;
    expectedDeliveryDate?: string;
    gold?: GoldRow[];
    diamonds?: DiamondRow[];
    notes?: string;
    status?: string;
    challanUrl?: string;
  };
  canDelete?: boolean;
};

const emptyGold: GoldRow = { inventoryTransactionId: "", purity: "", grossWeight: "", pureWeight: "" };
const emptyDiamond: DiamondRow = { inventoryTransactionId: "", sieveSize: "", pcs: "1", carat: "" };

export function KarigarIssueForm({ mode, actionUrl, karigars, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gold, setGold] = useState<GoldRow[]>(
    initialValues?.gold?.length ? (initialValues.gold as GoldRow[]) : [{ ...emptyGold }]
  );
  const [diamonds, setDiamonds] = useState<DiamondRow[]>(
    initialValues?.diamonds?.length ? (initialValues.diamonds as DiamondRow[]) : [{ ...emptyDiamond }]
  );

  function updateGold(index: number, key: keyof GoldRow, value: string) {
    setGold((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }
  function updateDiamond(index: number, key: keyof DiamondRow, value: string) {
    setDiamonds((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("gold", JSON.stringify(gold));
      form.set("diamonds", JSON.stringify(diamonds));
      const response = await fetch(actionUrl, { method: mode === "create" ? "POST" : "PATCH", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not save issue.");
      toast.success(mode === "create" ? "Karigar issue created." : "Karigar issue updated.");
      router.push("/dashboard/manufacturing/issues");
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
    if (!window.confirm("Delete this issue? This cannot be undone.")) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not delete issue.");
      toast.success("Issue deleted.");
      router.push("/dashboard/manufacturing/issues");
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

      {/* ── Issue header ────────────────────────────────────────────── */}
      <SectionCard
        title="Issue header"
        description="Karigar, schedule, and design brief."
        icon={Hammer}
        columns={2}
      >
        <FormField label="Karigar" required>
          <select
            name="karigarId"
            defaultValue={initialValues?.karigarId ?? karigars[0]?.id ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {karigars.map((k) => (
              <option key={k.id} value={k.id}>
                {k.karigarCode ? `${k.karigarCode} · ` : ""}{k.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status">
          <ReferenceSelect
            name="status"
            options={ISSUE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "DRAFT"}
          />
        </FormField>
        <FormField label="Issue date" required>
          <DateInput name="issueDate" defaultValue={initialValues?.issueDate ?? ""} pastOnly />
        </FormField>
        <FormField label="Expected delivery">
          <DateInput name="expectedDeliveryDate" defaultValue={initialValues?.expectedDeliveryDate ?? ""} />
        </FormField>
        <FormField label="Design reference" className="sm:col-span-2">
          <Input
            name="designReference"
            defaultValue={initialValues?.designReference ?? ""}
            placeholder="Sketch ID, customer preference, or custom design code"
          />
        </FormField>
        <FormField label="Notes" className="sm:col-span-2">
          <Textarea
            name="notes"
            rows={2}
            defaultValue={initialValues?.notes ?? ""}
            placeholder="Special instructions, finish requirements…"
          />
        </FormField>
      </SectionCard>

      {/* ── Gold material ───────────────────────────────────────────── */}
      <SectionCard
        title="Gold material"
        description="Raw gold issued to the karigar. One row per lot."
        icon={List}
        headerRight={
          <Button type="button" size="sm" variant="outline" onClick={() => setGold((c) => [...c, { ...emptyGold }])}>
            <Plus className="mr-1 size-4" /> Add row
          </Button>
        }
      >
        <div className="sm:col-span-2 space-y-3">
          {gold.map((row, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField label="Inventory ref.">
                  <Input
                    value={row.inventoryTransactionId}
                    onChange={(e) => updateGold(idx, "inventoryTransactionId", e.target.value)}
                    placeholder="Transaction ID"
                  />
                </FormField>
                <FormField label="Purity">
                  <Input
                    value={row.purity}
                    onChange={(e) => updateGold(idx, "purity", e.target.value)}
                    placeholder="e.g. 916"
                  />
                </FormField>
                <FormField label="Gross wt (g)">
                  <WeightInput
                    name={`gold-gross-${idx}`}
                    unit="g"
                    value={row.grossWeight}
                    onValueChange={(v) => updateGold(idx, "grossWeight", v)}
                  />
                </FormField>
                <FormField label="Pure wt (g)">
                  <WeightInput
                    name={`gold-pure-${idx}`}
                    unit="g"
                    value={row.pureWeight}
                    onValueChange={(v) => updateGold(idx, "pureWeight", v)}
                  />
                </FormField>
              </div>
              {gold.length > 1 && (
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setGold((c) => c.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 size-3.5" /> Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Diamond material ────────────────────────────────────────── */}
      <SectionCard
        title="Diamond material"
        description="Diamonds issued. One row per sieve / lot."
        icon={Gem}
        headerRight={
          <Button type="button" size="sm" variant="outline" onClick={() => setDiamonds((c) => [...c, { ...emptyDiamond }])}>
            <Plus className="mr-1 size-4" /> Add row
          </Button>
        }
      >
        <div className="sm:col-span-2 space-y-3">
          {diamonds.map((row, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField label="Inventory ref.">
                  <Input
                    value={row.inventoryTransactionId}
                    onChange={(e) => updateDiamond(idx, "inventoryTransactionId", e.target.value)}
                    placeholder="Transaction ID"
                  />
                </FormField>
                <FormField label="Sieve size">
                  <Input
                    value={row.sieveSize}
                    onChange={(e) => updateDiamond(idx, "sieveSize", e.target.value)}
                    placeholder="e.g. +8"
                  />
                </FormField>
                <FormField label="Pcs">
                  <Input
                    type="number"
                    min="1"
                    value={row.pcs}
                    onChange={(e) => updateDiamond(idx, "pcs", e.target.value)}
                  />
                </FormField>
                <FormField label="Carat (ct)">
                  <WeightInput
                    name={`diamond-carat-${idx}`}
                    unit="ct"
                    value={row.carat}
                    onValueChange={(v) => updateDiamond(idx, "carat", v)}
                  />
                </FormField>
              </div>
              {diamonds.length > 1 && (
                <div className="flex justify-end">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setDiamonds((c) => c.filter((_, i) => i !== idx))} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-1 size-3.5" /> Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ── Documents ───────────────────────────────────────────────── */}
      <SectionCard title="Documents" icon={Paperclip} columns={1}>
        <FileUpload
          kind="karigar-issues"
          variant="document"
          name="challanUrl"
          label="Challan / work order"
          initialUrl={initialValues?.challanUrl}
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Create issue" : "Save changes"}
        onCancel={() => router.back()}
        onDelete={mode === "edit" && canDelete ? onDelete : undefined}
        deleteLabel="Delete issue"
        sticky
      />
    </form>
  );
}
