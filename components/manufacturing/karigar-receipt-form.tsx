"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/ui/file-upload";

type IssueOption = { id: string; issueNo: string };

type InitialValues = {
  issueId?: string;
  receiveDate?: string;
  labourCharge?: string;
  labourType?: string;
  jewellery?: unknown[];
  status?: string;
  signedReceiptUrl?: string;
};

type Props = {
  mode?: "create" | "edit";
  actionUrl: string;
  method?: "POST" | "PATCH";
  issues: IssueOption[];
  initialValues?: InitialValues;
};

const DEFAULT_JEWELLERY = [
  {
    category: "",
    subCategory: "",
    productName: "",
    quantity: "1",
    grossWeight: "",
    netWeight: "",
    purity: "",
    wastage: "",
    makingCharge: "",
    diamond: [],
    remarks: "",
  },
];

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
  const [jewelleryJson, setJewelleryJson] = useState(
    JSON.stringify(
      initialValues?.jewellery?.length ? initialValues.jewellery : DEFAULT_JEWELLERY,
      null,
      2
    )
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(actionUrl, {
        method,
        body: new FormData(event.currentTarget),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Could not save receipt.");
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
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === "edit" ? "Edit karigar receipt" : "Create karigar receipt"}
        </CardTitle>
        <CardDescription>
          {mode === "edit"
            ? "Update the receipt. Once completed, jewellery items become read-only to protect downstream products."
            : "Complete a finished jewellery return and auto-create the product record."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <form className="space-y-4" onSubmit={onSubmit}>
          {mode === "create" ? (
            <div className="space-y-2">
              <Label>Issue</Label>
              <select
                name="issueId"
                defaultValue={initialValues?.issueId ?? ""}
                className="h-10 w-full rounded-md border px-3 py-2"
              >
                {issues.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.issueNo}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Receive date</Label>
            <Input
              type="date"
              name="receiveDate"
              defaultValue={initialValues?.receiveDate ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Labour charge</Label>
            <Input
              name="labourCharge"
              defaultValue={initialValues?.labourCharge ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Labour type</Label>
            <Input
              name="labourType"
              defaultValue={initialValues?.labourType ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <select
              name="status"
              defaultValue={initialValues?.status ?? "PENDING"}
              className="h-10 w-full rounded-md border px-3 py-2"
            >
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Jewellery JSON</Label>
            <textarea
              className="min-h-40 w-full rounded-md border px-3 py-2 font-mono text-xs"
              value={jewelleryJson}
              onChange={(e) => setJewelleryJson(e.target.value)}
            />
          </div>
          <input type="hidden" name="jewellery" value={jewelleryJson} />
          <div className="grid gap-4 sm:grid-cols-2">
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
          </div>
          <div className="flex gap-3">
            <Button disabled={loading} type="submit">
              {loading
                ? "Saving..."
                : mode === "edit"
                ? "Save changes"
                : "Save receipt"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
