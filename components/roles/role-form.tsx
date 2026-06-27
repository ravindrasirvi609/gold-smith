"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PermissionOption } from "@/lib/admin-permissions";
import type { RoleFormValues } from "@/lib/admin-roles";

type RoleFormProps = {
  mode: "create" | "edit";
  actionUrl: string;
  permissions: PermissionOption[];
  canDelete?: boolean;
  initialValues?: Partial<RoleFormValues & { isSystem?: boolean }>;
};

export function RoleForm({ mode, actionUrl, permissions, canDelete, initialValues }: RoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    name: initialValues?.name ?? "",
    description: initialValues?.description ?? "",
    permissionIds: initialValues?.permissionIds ?? [],
    isActive: initialValues?.isActive ?? true,
  });

  function togglePermission(permissionId: string) {
    setFormValues((current) => ({
      ...current,
      permissionIds: current.permissionIds.includes(permissionId)
        ? current.permissionIds.filter((id) => id !== permissionId)
        : [...current.permissionIds, permissionId],
    }));
  }

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
        throw new Error(data?.message || "Could not save the role.");
      }

      router.push("/dashboard/roles");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this role? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(actionUrl, { method: "DELETE" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || "Could not delete the role.");
      }

      router.push("/dashboard/roles");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const permissionsByModule = permissions.reduce<Record<string, PermissionOption[]>>(
    (groups, permission) => {
      const moduleName = permission.module || "Other";
      groups[moduleName] = groups[moduleName] ?? [];
      groups[moduleName].push(permission);
      return groups;
    },
    {}
  );

  return (
    <Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === "create" ? "Create role" : "Edit role"}
        </CardTitle>
        <CardDescription>
          Define a role and assign the permissions it should grant.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialValues?.isSystem ? (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
            This is a system role. You can update its permissions and status, but it cannot be deleted.
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        <form className="grid gap-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              required
              value={formValues.name}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
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
          <div className="space-y-3">
            <Label>Permissions</Label>
            <div className="space-y-4 rounded-lg border p-4">
              {Object.entries(permissionsByModule).map(([moduleName, modulePermissions]) => (
                <div key={moduleName} className="space-y-2">
                  <p className="text-sm font-medium">{moduleName}</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {modulePermissions.map((permission) => (
                      <label
                        key={permission.id}
                        className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="permissionIds"
                          value={permission.id}
                          checked={formValues.permissionIds.includes(permission.id)}
                          onChange={() => togglePermission(permission.id)}
                          className="mt-1"
                        />
                        <span>
                          <span className="font-medium">{permission.action}</span>
                          <span className="block text-xs text-muted-foreground">
                            {permission.code}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {!permissions.length ? (
                <p className="text-sm text-muted-foreground">No active permissions available.</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create role" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
            {mode === "edit" && canDelete && !initialValues?.isSystem ? (
              <Button type="button" variant="destructive" onClick={onDelete} disabled={loading}>
                Delete role
              </Button>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
