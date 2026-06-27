"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Option = { id: string; name: string };
type IssueItem = Record<string, string>;
type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  karigars: Option[];
  initialValues?: {
    karigarId?: string;
    issueDate?: string;
    designReference?: string;
    expectedDeliveryDate?: string;
    gold?: IssueItem[];
    diamonds?: IssueItem[];
    notes?: string;
    status?: string;
  };
  canDelete?: boolean;
};

const emptyGold = { inventoryTransactionId: "", purity: "", grossWeight: "", pureWeight: "" };
const emptyDiamond = { inventoryTransactionId: "", sieveSize: "", pcs: "", carat: "" };

export function KarigarIssueForm({ mode, actionUrl, karigars, initialValues, canDelete }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gold, setGold] = useState<IssueItem[]>(initialValues?.gold?.length ? initialValues.gold : [emptyGold]);
  const [diamonds, setDiamonds] = useState<IssueItem[]>(initialValues?.diamonds?.length ? initialValues.diamonds : [emptyDiamond]);
  const [formValues, setFormValues] = useState({
    karigarId: initialValues?.karigarId ?? karigars[0]?.id ?? "",
    issueDate: initialValues?.issueDate ?? "",
    designReference: initialValues?.designReference ?? "",
    expectedDeliveryDate: initialValues?.expectedDeliveryDate ?? "",
    notes: initialValues?.notes ?? "",
    status: initialValues?.status ?? "DRAFT",
  });
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
      if (!response.ok) throw new Error(data?.message || "Could not save issue.");
      router.push("/dashboard/manufacturing/issues");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card>
      <CardHeader><CardTitle>{mode === "create" ? "Create karigar issue" : "Edit karigar issue"}</CardTitle><CardDescription>Issue raw material to the karigar.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <form className="space-y-6" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Karigar</Label><select name="karigarId" value={formValues.karigarId} onChange={(e) => setFormValues((c) => ({ ...c, karigarId: e.target.value }))} className="h-10 w-full rounded-md border px-3 py-2">{karigars.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></div>
            <div className="space-y-2"><Label>Status</Label><select name="status" value={formValues.status} onChange={(e) => setFormValues((c) => ({ ...c, status: e.target.value }))} className="h-10 w-full rounded-md border px-3 py-2"><option value="DRAFT">Draft</option><option value="ISSUED">Issued</option><option value="PARTIALLY_RECEIVED">Partially Received</option><option value="COMPLETED">Completed</option><option value="CANCELLED">Cancelled</option></select></div>
            <div className="space-y-2"><Label>Issue date</Label><Input type="date" name="issueDate" value={formValues.issueDate} onChange={(e) => setFormValues((c) => ({ ...c, issueDate: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Expected date</Label><Input type="date" name="expectedDeliveryDate" value={formValues.expectedDeliveryDate} onChange={(e) => setFormValues((c) => ({ ...c, expectedDeliveryDate: e.target.value }))} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Design reference</Label><Input name="designReference" value={formValues.designReference} onChange={(e) => setFormValues((c) => ({ ...c, designReference: e.target.value }))} /></div>
          </div>
          <input type="hidden" name="notes" value={formValues.notes} />
          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex justify-between"><h3 className="font-medium">Gold</h3><Button type="button" variant="outline" onClick={() => setGold((c) => [...c, emptyGold])}>Add gold</Button></div>
            {gold.map((row, index) => <div key={index} className="grid gap-2 md:grid-cols-4">{["inventoryTransactionId","purity","grossWeight","pureWeight"].map((key) => <Input key={key} placeholder={key} value={row[key]} onChange={(e) => setGold((current) => current.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} />)}</div>)}
          </section>
          <section className="space-y-3 rounded-2xl border p-4">
            <div className="flex justify-between"><h3 className="font-medium">Diamonds</h3><Button type="button" variant="outline" onClick={() => setDiamonds((c) => [...c, emptyDiamond])}>Add diamond</Button></div>
            {diamonds.map((row, index) => <div key={index} className="grid gap-2 md:grid-cols-4">{["inventoryTransactionId","sieveSize","pcs","carat"].map((key) => <Input key={key} placeholder={key} value={row[key]} onChange={(e) => setDiamonds((current) => current.map((item, i) => i === index ? { ...item, [key]: e.target.value } : item))} />)}</div>)}
          </section>
          <div className="flex flex-wrap gap-3"><Button disabled={loading} type="submit">{loading ? "Saving..." : "Save issue"}</Button><Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>{mode === "edit" && canDelete ? <Button type="button" variant="destructive">Delete issue</Button> : null}</div>
        </form>
      </CardContent>
    </Card>
  );
}

