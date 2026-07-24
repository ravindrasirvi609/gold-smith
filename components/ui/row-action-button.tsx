"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RowActionButtonProps = {
  url: string;
  method?: "DELETE" | "POST" | "PATCH";
  body?: FormData | Record<string, string> | null;
  confirm?: string;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
  onDone?: () => void;
};

/**
 * A small client button used inside server-rendered list tables.
 *
 * On click:
 *   1. Optionally confirms with the user (browser confirm — replace with a
 *      styled dialog when you introduce one).
 *   2. Fires an authenticated request to `url` with the given method.
 *   3. Shows a toast for success/failure.
 *   4. Calls router.refresh() so the server component re-renders.
 */
export function RowActionButton({
  url,
  method = "POST",
  body = null,
  confirm,
  successMessage = "Done.",
  className,
  children,
  onDone,
}: RowActionButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    try {
      let fetchBody: BodyInit | undefined;
      if (body instanceof FormData) fetchBody = body;
      else if (body && typeof body === "object") {
        const fd = new FormData();
        for (const [k, v] of Object.entries(body)) fd.append(k, v);
        fetchBody = fd;
      }
      const res = await fetch(url, { method, body: fetchBody });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || "Action failed.");
      }
      toast.success(successMessage);
      onDone?.();
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={handleClick}
      className={cn(
        "text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      {busy ? "…" : children}
    </button>
  );
}
