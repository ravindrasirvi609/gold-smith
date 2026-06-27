"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PermissionFormValues } from "@/lib/admin-permissions";

type PermissionFormProps = {
  mode: "create" | "edit";
  actionUrl: string;
  canDelete?: boolean;
  initialValues?: Partial<PermissionFormValues>;
};

export function PermissionForm({ mode, actionUrl, canDelete, initialValues }: PermissionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    module: initialValues?.module ?? "",
    action: initialValues?.action ?? "",
    code: initialValues?.code ?? "",
    description: initialValues?.description ?? "",
    isActive: initialValues?.isActive ?? true,
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(actionUrl, {
        method: mode === "create" ? "POST" : "PATCH",
        body: new FormData(event.currentTarget),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not save the permission.");
      }

      router.push("/dashboard/permissions");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this permission? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not delete the permission.");
      }

      router.push("/dashboard/permissions");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === "create" ? "Create permission" : "Edit permission"}
        </CardTitle>
        <CardDescription>
          Define a permission code that can be assigned to roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="module">Module</Label>
            <Input
              id="module"
              name="module"
              required
              placeholder="User"
              value={formValues.module}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  module: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Input
              id="action"
              name="action"
              required
              placeholder="View"
              value={formValues.action}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  action: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              name="code"
              required
              placeholder="USER_VIEW"
              value={formValues.code}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  code: event.target.value.toUpperCase(),
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={formValues.description}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <select
              id="isActive"
              name="isActive"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formValues.isActive ? "true" : "false"}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  isActive: event.target.value === "true",
                }))
              }
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create permission" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            {mode === "edit" && canDelete ? (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
                Delete permission
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
