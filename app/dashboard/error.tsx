"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] uncaught error", error);
  }, [error]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center px-6">
        <div className="w-full space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">
            Dashboard error
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            We couldn&apos;t load that page
          </h1>
          <p className="text-sm text-muted-foreground">
            The page failed to render. This usually clears up with a retry. If
            it keeps happening, contact your administrator with the reference
            code below.
          </p>
          {error.digest ? (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
          <div className="flex gap-3 pt-2">
            <Button onClick={reset}>Try again</Button>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
