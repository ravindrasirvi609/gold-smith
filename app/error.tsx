"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // In production, hook a real error tracker here (Sentry, Highlight, etc.)
    console.error("[app] uncaught error", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-background text-foreground">
      <div className="mx-auto max-w-lg space-y-4 rounded-3xl border bg-card p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          We hit an unexpected error
        </h1>
        <p className="text-sm text-muted-foreground">
          The problem has been logged. Try again, or head back to the dashboard
          to continue.
        </p>
        {error.digest ? (
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
            Reference: {error.digest}
          </p>
        ) : null}
        <div className="flex justify-center gap-3 pt-2">
          <Button onClick={reset}>Try again</Button>
          <a
            href="/dashboard"
            className="inline-flex h-9 items-center rounded-md border px-4 text-sm hover:bg-muted"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
