"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SubmitOptions = {
  /** URL to POST/PATCH to. */
  actionUrl: string;
  method?: "POST" | "PATCH";
  /** Where to send the user after a successful submit. */
  redirectTo?: string;
  /** Toast message on success. */
  successMessage: string;
  /** Called after a successful response before the redirect. */
  onSuccess?: (data: unknown) => void;
};

/**
 * Shared form-submit hook that:
 *   1. Builds FormData from the submitted form,
 *   2. Sends it to `actionUrl`,
 *   3. Toasts a success message and/or an error,
 *   4. Optionally redirects and refreshes the server tree.
 *
 * Returns `{ loading, error, handleSubmit }` so forms keep their inline
 * error banner behaviour but also get the shared toast.
 */
export function useFormSubmit(opts: SubmitOptions) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(opts.actionUrl, {
        method: opts.method ?? "POST",
        body: new FormData(event.currentTarget),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message || "Something went wrong.");
      }
      toast.success(opts.successMessage);
      opts.onSuccess?.(data);
      if (opts.redirectTo) {
        startTransition(() => {
          router.push(opts.redirectTo!);
          router.refresh();
        });
      } else {
        startTransition(() => router.refresh());
      }
      return true;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { loading, error, handleSubmit };
}
