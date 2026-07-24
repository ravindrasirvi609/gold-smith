"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Users, Package, Plus, Trash2 } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  DateInput,
  WeightInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { EntityOption } from "@/lib/admin-entity-options";

type ProductRow = {
  productId: string;
  issueWeight: string;
  quantity: string;
  remarks: string;
};

function emptyProduct(): ProductRow {
  return { productId: "", issueWeight: "", quantity: "1", remarks: "" };
}

type Props = {
  customers: EntityOption[];
  products: EntityOption[];
};

export function ApprovalForm({ customers, products }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProductRow[]>([emptyProduct()]);

  function updateRow(index: number, key: keyof ProductRow, value: string) {
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const form = new FormData(event.currentTarget);
      form.set("products", JSON.stringify(rows));
      const response = await fetch("/api/approvals", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not create approval.");
      toast.success("Approval created.");
      router.push(`/dashboard/approvals/${data.id}`);
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

      {/* ── Approval header ─────────────────────────────────────────── */}
      <SectionCard
        title="Approval header"
        description="Customer, dates, and purpose."
        icon={Users}
        columns={2}
      >
        <FormField label="Customer" required>
          <select
            name="customerId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue=""
          >
            <option value="" disabled>Select a customer</option>
            {customers.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Issue date" required>
          <DateInput name="issueDate" defaultValue={new Date().toISOString().slice(0, 10)} pastOnly />
        </FormField>
        <FormField label="Expected return date">
          <DateInput name="expectedReturnDate" defaultValue="" />
        </FormField>
        <FormField label="Purpose" className="sm:col-span-2">
          <Input name="purpose" placeholder="e.g. Wedding selection, Customer trial…" />
        </FormField>
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea name="remarks" rows={2} placeholder="Any additional notes…" />
        </FormField>
      </SectionCard>

      {/* ── Products ────────────────────────────────────────────────── */}
      <SectionCard
        title="Products issued"
        description="Select available jewellery items to send out on approval."
        icon={Package}
        headerRight={
          <Button type="button" size="sm" variant="outline" onClick={() => setRows((c) => [...c, emptyProduct()])}>
            <Plus className="mr-1 size-4" /> Add item
          </Button>
        }
      >
        <div className="sm:col-span-2 space-y-3">
          {rows.map((row, idx) => (
            <div key={idx} className="rounded-xl border p-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField label="Product" required className="sm:col-span-2">
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={row.productId}
                    onChange={(e) => updateRow(idx, "productId", e.target.value)}
                  >
                    <option value="" disabled>Select product</option>
                    {products.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Qty">
                  <Input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                  />
                </FormField>
                <FormField label="Issue wt (g)">
                  <WeightInput
                    name={`row-wt-${idx}`}
                    unit="g"
                    value={row.issueWeight}
                    onValueChange={(v) => updateRow(idx, "issueWeight", v)}
                  />
                </FormField>
              </div>
              <FormField label="Remarks">
                <Input
                  value={row.remarks}
                  onChange={(e) => updateRow(idx, "remarks", e.target.value)}
                  placeholder="Condition notes, customer request…"
                />
              </FormField>
              {rows.length > 1 && (
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRows((c) => c.filter((_, i) => i !== idx))}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-1 size-3.5" /> Remove
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel="Create approval"
        onCancel={() => router.push("/dashboard/approvals")}
        sticky
      />
    </form>
  );
}
