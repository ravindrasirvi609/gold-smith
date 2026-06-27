export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-16">
        <div className="grid gap-6 rounded-3xl border bg-card p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              MongoDB is configured
            </p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
              End-to-end database setup is ready.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              The app now uses a reusable MongoDB client, an environment-based
              connection string, and a health route at{" "}
              <code className="rounded bg-muted px-1.5 py-0.5">
                /api/health/db
              </code>
              .
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">What’s in place</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>Singleton MongoDB connection helper in `lib/mongodb.ts`</li>
                <li>Database name configurable through `MONGODB_DB_NAME`</li>
                <li>Ping endpoint to verify the connection</li>
                <li>`.env.local.example` for safe local setup</li>
              </ul>
            </div>

            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">Next step</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Put your actual MongoDB URI into `.env.local`, rotate the
                credential you shared here, and open the health route to confirm
                the connection works.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
