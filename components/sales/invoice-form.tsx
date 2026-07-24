"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Receipt, Package, Calculator, Plus, Trash2 } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  DateInput,
  MoneyInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SALE_TYPES } from "@/lib/reference-data";
import { formatINR } from "@/lib/formatters";
import type { EntityOption } from "@/lib/admin-entity-options";

type ProductRow = {
  productId: string;
  quantity: string;
  goldRate: string;
  makingCharge: string;
  stoneAmount: string;
  discount: string;
  gst: string;
};

function emptyProduct(): ProductRow {
  return {
    productId: "",
    quantity: "1",
    goldRate: "",
    makingCharge: "",
    stoneAmount: "0",
    discount: "0",
    gst: "0",
  };
}

function rowTotal(row: ProductRow) {
  return (
    Number(row.quantity || 0) * Number(row.goldRate || 0) +
    Number(row.makingCharge || 0) +
    Number(row.stoneAmount || 0) -
    Number(row.discount || 0) +
    Number(row.gst || 0)
  );
}

type Props = {
  customers: EntityOption[];
  products: EntityOption[];
  approvals?: EntityOption[];
};

export function InvoiceForm({ customers, products, approvals = [] }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ProductRow[]>([emptyProduct()]);

  const grandTotal = rows.reduce((sum, row) => sum + rowTotal(row), 0);

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
      const response = await fetch("/api/invoices", { method: "POST", body: form });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? "Could not create invoice.");
      toast.success("Invoice created.");
      router.push(`/dashboard/invoices/${data.id}`);
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

      {/* ── Invoice header ──────────────────────────────────────────── */}
      <SectionCard
        title="Invoice header"
        description="Customer, sale type, and invoice date."
        icon={Receipt}
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
        <FormField label="Sale type" required>
          <ReferenceSelect
            name="saleType"
            options={SALE_TYPES}
            defaultValue="DIRECT"
          />
        </FormField>
        <FormField label="Invoice date" required>
          <DateInput name="invoiceDate" defaultValue={new Date().toISOString().slice(0, 10)} pastOnly />
        </FormField>
        {approvals.length > 0 && (
          <FormField label="Linked approval" hint="Convert an existing approval to invoice">
            <select
              name="approvalId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              defaultValue=""
            >
              <option value="">None (direct sale)</option>
              {approvals.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="Remarks" className="sm:col-span-2">
          <Textarea name="remarks" rows={2} placeholder="Any notes about this invoice…" />
        </FormField>
      </SectionCard>

      {/* ── Products ────────────────────────────────────────────────── */}
      <SectionCard
        title="Products"
        description="Add products being sold. Rates and charges per item."
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
              <FormField label="Product" required>
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
              <div className="grid gap-3 sm:grid-cols-4">
                <FormField label="Qty">
                  <Input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRow(idx, "quantity", e.target.value)}
                  />
                </FormField>
                <FormField label="Gold rate (₹/g)">
                  <MoneyInput
                    name={`row-rate-${idx}`}
                    value={row.goldRate}
                    onValueChange={(v) => updateRow(idx, "goldRate", v)}
                  />
                </FormField>
                <FormField label="Making charge (₹)">
                  <MoneyInput
                    name={`row-making-${idx}`}
                    value={row.makingCharge}
                    onValueChange={(v) => updateRow(idx, "makingCharge", v)}
                  />
                </FormField>
                <FormField label="Stone amount (₹)">
                  <MoneyInput
                    name={`row-stone-${idx}`}
                    value={row.stoneAmount}
                    onValueChange={(v) => updateRow(idx, "stoneAmount", v)}
                  />
                </FormField>
                <FormField label="Discount (₹)">
                  <MoneyInput
                    name={`row-disc-${idx}`}
                    value={row.discount}
                    onValueChange={(v) => updateRow(idx, "discount", v)}
                  />
                </FormField>
                <FormField label="GST (₹)">
                  <MoneyInput
                    name={`row-gst-${idx}`}
                    value={row.gst}
                    onValueChange={(v) => updateRow(idx, "gst", v)}
                  />
                </FormField>
                <FormField label="Row total" className="sm:col-span-2">
                  <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm font-medium tabular-nums">
                    {formatINR(rowTotal(row))}
                  </div>
                </FormField>
              </div>
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

      {/* ── Grand total ─────────────────────────────────────────────── */}
      <SectionCard title="Total" icon={Calculator} columns={1}>
        <div className="rounded-xl border bg-muted/40 px-4 py-3 text-sm">
          <div className="flex justify-between font-semibold text-base">
            <span>Grand total</span>
            <span className="tabular-nums">{formatINR(grandTotal)}</span>
          </div>
        </div>
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel="Create invoice"
        onCancel={() => router.push("/dashboard/invoices")}
        sticky
      />
    </form>
  );
}
