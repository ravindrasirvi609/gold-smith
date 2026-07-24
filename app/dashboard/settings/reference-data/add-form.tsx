"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EditableKind } from "@/lib/reference-data";

/**
 * Compact inline form to add one reference-data option to a specific
 * `kind`. The list refreshes via `router.refresh()` after a successful
 * POST — no client-side state juggling needed.
 */
export function ReferenceDataAddForm({ kind }: { kind: EditableKind }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [, startTransition] = useTransition();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData(event.currentTarget);
      formData.set("kind", kind);
      const response = await fetch("/api/reference-data", {
        method: "POST",
        body: formData,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Could not save option.");
      }
      event.currentTarget.reset();
      toast.success("Option added.");
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-3 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto] sm:items-end"
    >
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Value</Label>
        <Input name="value" placeholder="E.g. TENNIS_BRACELET" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Label</Label>
        <Input name="label" placeholder="Tennis bracelet" required />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Parent (optional)</Label>
        <Input name="parent" placeholder="BRACELET" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Hint (optional)</Label>
        <Input name="hint" placeholder="Short description" />
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Adding…" : "Add option"}
      </Button>
    </form>
  );
}
