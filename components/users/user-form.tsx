"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RoleOption, UserFormValues } from "@/lib/admin-users";
import { FileUpload } from "@/components/ui/file-upload";

type UserFormProps = {
  mode: "create" | "edit";
  actionUrl: string;
  roles: RoleOption[];
  initialValues?: Partial<UserFormValues>;
};

export function UserForm({ mode, actionUrl, roles, initialValues }: UserFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    firstName: initialValues?.firstName ?? "",
    lastName: initialValues?.lastName ?? "",
    email: initialValues?.email ?? "",
    mobile: initialValues?.mobile ?? "",
    password: "",
    roleId: initialValues?.roleId ?? roles[0]?.id ?? "",
    status: initialValues?.status ?? "ACTIVE",
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
        throw new Error(data?.message || "Could not save the user.");
      }

      router.push("/dashboard/users");
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border/60 bg-card/95 shadow-lg shadow-black/5">
      <CardHeader>
        <CardTitle className="text-2xl">
          {mode === "create" ? "Create user" : "Edit user"}
        </CardTitle>
        <CardDescription>
          Add a user, assign a role, and keep the interface simple.
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
            <Label htmlFor="firstName">First name</Label>
            <Input
              id="firstName"
              name="firstName"
              required
              value={formValues.firstName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  firstName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input
              id="lastName"
              name="lastName"
              value={formValues.lastName}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  lastName: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formValues.email}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile</Label>
            <Input
              id="mobile"
              name="mobile"
              value={formValues.mobile}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  mobile: event.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roleId">Role</Label>
            <select
              id="roleId"
              name="roleId"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formValues.roleId}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  roleId: event.target.value,
                }))
              }
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formValues.status}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  status: event.target.value as UserFormValues["status"],
                }))
              }
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="password">
              {mode === "create" ? "Password" : "New password"}
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder={mode === "create" ? "Set a password" : "Leave blank to keep current password"}
              value={formValues.password}
              onChange={(event) =>
                setFormValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              required={mode === "create"}
            />
          </div>
          <div className="md:col-span-2">
            <FileUpload kind="users" variant="image" name="profileImage" label="Profile photo" initialUrl={initialValues?.profileImage ?? undefined} />
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : mode === "create" ? "Create user" : "Save changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
