import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-10">
        <Skeleton className="h-3 w-24" />
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-muted-foreground/40">
          Dashboard
        </h1>
        <Skeleton className="mt-3 h-3 w-80" />

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-32" />
              <Skeleton className="mt-2 h-3 w-16" />
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="mt-4 h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
