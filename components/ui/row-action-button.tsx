"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type Tone = "default" | "danger" | "warning";

type RowActionButtonProps = {
  url: string;
  method?: "DELETE" | "POST" | "PATCH";
  body?: FormData | Record<string, string> | null;
  /** Confirmation title. When omitted the button acts without a dialog. */
  confirmTitle?: string;
  confirmDescription?: string;
  /** Legacy free-text confirm — used when neither title nor description are set. */
  confirm?: string;
  successMessage?: string;
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
  onDone?: () => void;
};

const toneClasses: Record<Tone, string> = {
  default: "",
  danger: "text-destructive",
  warning: "text-amber-700 dark:text-amber-400",
};

/**
 * A small client button used inside server-rendered list tables.
 *
 * Presents a styled AlertDialog for confirmation, fires the request with
 * credentials, surfaces a toast, and refreshes the server component tree.
 * Passing `confirmTitle` / `confirmDescription` uses the shadcn dialog; the
 * legacy `confirm` string falls back to the same dialog with a generic
 * title.
 */
export function RowActionButton({
  url,
  method = "POST",
  body = null,
  confirmTitle,
  confirmDescription,
  confirm,
  successMessage = "Done.",
  tone = "default",
  className,
  children,
  onDone,
}: RowActionButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const title = confirmTitle ?? "Are you sure?";
  const description = confirmDescription ?? confirm ?? "This action cannot be undone.";

  async function performAction() {
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
      if (!res.ok) throw new Error(data?.message || "Action failed.");
      toast.success(successMessage);
      onDone?.();
      setOpen(false);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        disabled={busy}
        className={cn(
          "text-sm underline underline-offset-4 disabled:cursor-not-allowed disabled:opacity-50",
          toneClasses[tone],
          className
        )}
      >
        {busy ? "…" : children}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              performAction();
            }}
            className={tone === "danger" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {busy ? "Working…" : "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
