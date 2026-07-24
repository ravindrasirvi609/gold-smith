"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, UserCircle, ShieldCheck, ImageIcon } from "lucide-react";
import {
  FormField,
  SectionCard,
  FormActions,
  ReferenceSelect,
  MobileInput,
} from "@/components/forms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { ACTIVE_STATUSES } from "@/lib/reference-data";
import type { RoleOption, UserFormValues } from "@/lib/admin-users";
import { cn } from "@/lib/utils";

/** Measures password strength 0-4 based on criteria met. */
function scorePassword(pwd: string): 0 | 1 | 2 | 3 | 4 {
  if (!pwd) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3 | 4;
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"] as const;
const STRENGTH_BAR_CLASSES: Record<number, string> = {
  0: "bg-transparent",
  1: "bg-red-500",
  2: "bg-amber-500",
  3: "bg-blue-500",
  4: "bg-emerald-500",
};

type Props = {
  mode: "create" | "edit";
  actionUrl: string;
  roles: RoleOption[];
  initialValues?: Partial<UserFormValues>;
};

export function UserForm({ mode, actionUrl, roles, initialValues }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = scorePassword(password);

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
      if (!response.ok) throw new Error(data?.message ?? "Could not save the user.");
      toast.success(mode === "create" ? "User created." : "User updated.");
      router.push("/dashboard/users");
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

      {/* ── Identity ─────────────────────────────────────────────────── */}
      <SectionCard
        title="Identity"
        description="Name, contact, and account status."
        icon={UserCircle}
        columns={2}
      >
        <FormField label="First name" required>
          <Input
            name="firstName"
            defaultValue={initialValues?.firstName ?? ""}
            placeholder="e.g. Anita"
          />
        </FormField>
        <FormField label="Last name">
          <Input
            name="lastName"
            defaultValue={initialValues?.lastName ?? ""}
            placeholder="e.g. Patel"
          />
        </FormField>
        <FormField label="Email" required className="sm:col-span-2">
          <Input
            name="email"
            type="email"
            required
            defaultValue={initialValues?.email ?? ""}
            placeholder="user@example.com"
          />
        </FormField>
        <FormField label="Mobile">
          <MobileInput name="mobile" defaultValue={initialValues?.mobile ?? ""} />
        </FormField>
        <FormField label="Status" required>
          <ReferenceSelect
            name="status"
            options={ACTIVE_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            defaultValue={initialValues?.status ?? "ACTIVE"}
          />
        </FormField>
      </SectionCard>

      {/* ── Access ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Access"
        description="Role assignment and password."
        icon={ShieldCheck}
        columns={2}
      >
        <FormField label="Role" required>
          <select
            name="roleId"
            className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            defaultValue={initialValues?.roleId ?? roles[0]?.id ?? ""}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </FormField>

        {/* Password with show/hide + strength bar */}
        <FormField
          label={mode === "create" ? "Password" : "New password"}
          hint={mode === "edit" ? "Leave blank to keep the current password" : undefined}
          required={mode === "create"}
          className="sm:col-span-2"
        >
          <div className="relative">
            <Input
              name="password"
              type={showPassword ? "text" : "password"}
              required={mode === "create"}
              placeholder={
                mode === "create" ? "Set a secure password" : "Enter a new password to change it"
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
          </div>
          {password ? (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      strength >= n ? STRENGTH_BAR_CLASSES[strength] : "bg-muted"
                    )}
                  />
                ))}
              </div>
              {strength > 0 && (
                <p className="text-xs text-muted-foreground">
                  Password strength:{" "}
                  <span
                    className={cn(
                      "font-medium",
                      strength <= 1 && "text-red-600",
                      strength === 2 && "text-amber-600",
                      strength === 3 && "text-blue-600",
                      strength === 4 && "text-emerald-600"
                    )}
                  >
                    {STRENGTH_LABELS[strength]}
                  </span>
                </p>
              )}
            </div>
          ) : null}
        </FormField>
      </SectionCard>

      {/* ── Photo ────────────────────────────────────────────────────── */}
      <SectionCard
        title="Photo"
        description="Profile picture shown in the navigation bar."
        icon={ImageIcon}
        columns={1}
      >
        <FileUpload
          kind="users"
          variant="image"
          name="profileImage"
          label="Profile photo"
          initialUrl={initialValues?.profileImage ?? undefined}
        />
      </SectionCard>

      <FormActions
        loading={loading}
        saveLabel={mode === "create" ? "Create user" : "Save changes"}
        onCancel={() => router.back()}
        sticky
      />
    </form>
  );
}
