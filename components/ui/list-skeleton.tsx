import { Skeleton } from "@/components/ui/skeleton";

/**
 * Reusable list-page skeleton. Renders a heading placeholder, a toolbar
 * placeholder, and a table body of N grey rows.
 */
export function ListSkeleton({
  rows = 8,
  columns = 6,
  title = "Loading…",
}: {
  rows?: number;
  columns?: number;
  title?: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Skeleton className="h-3 w-24" />
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-muted-foreground/40">
              {title}
            </h1>
            <Skeleton className="mt-3 h-3 w-64" />
          </div>
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border bg-card/60 p-3">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="border-b bg-muted/40 px-4 py-3">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-16" />
              ))}
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, r) => (
              <div key={r} className="px-4 py-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                  {Array.from({ length: columns }).map((_, c) => (
                    <Skeleton key={c} className="h-4 w-full max-w-[75%]" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
