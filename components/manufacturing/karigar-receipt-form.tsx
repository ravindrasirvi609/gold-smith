"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IssueOption = { id: string; issueNo: string };
type Props = {
  actionUrl: string;
  issues: IssueOption[];
};

export function KarigarReceiptForm({ actionUrl, issues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jewelleryJson, setJewelleryJson] = useState('[{"category":"","subCategory":"","productName":"","quantity":"1","grossWeight":"","netWeight":"","purity":"","wastage":"","makingCharge":"","diamond":[],"remarks":""}]');
  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, { method: "POST", body: new FormData(event.currentTarget) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Could not save receipt.");
      router.push("/dashboard/manufacturing/receipts");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card>
      <CardHeader><CardTitle>Create karigar receipt</CardTitle><CardDescription>Complete a finished jewellery return and auto-create the product record.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2"><Label>Issue</Label><select name="issueId" className="h-10 w-full rounded-md border px-3 py-2">{issues.map((issue) => <option key={issue.id} value={issue.id}>{issue.issueNo}</option>)}</select></div>
          <div className="space-y-2"><Label>Receive date</Label><Input type="date" name="receiveDate" /></div>
          <div className="space-y-2"><Label>Labour charge</Label><Input name="labourCharge" /></div>
          <div className="space-y-2"><Label>Labour type</Label><Input name="labourType" /></div>
          <div className="space-y-2"><Label>Status</Label><select name="status" className="h-10 w-full rounded-md border px-3 py-2"><option value="PENDING">Pending</option><option value="COMPLETED">Completed</option><option value="REJECTED">Rejected</option></select></div>
          <div className="space-y-2"><Label>Jewellery JSON</Label><textarea name="jewellery" className="min-h-40 w-full rounded-md border px-3 py-2 font-mono text-xs" value={jewelleryJson} onChange={(e) => setJewelleryJson(e.target.value)} /></div>
          <input type="hidden" name="jewellery" value={jewelleryJson} />
          <div className="flex gap-3"><Button disabled={loading} type="submit">{loading ? "Saving..." : "Save receipt"}</Button><Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button></div>
        </form>
      </CardContent>
    </Card>
  );
}

