export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(245,245,245,1)_55%,_rgba(229,231,235,1))] text-foreground dark:bg-[radial-gradient(circle_at_top,_rgba(38,38,38,1),_rgba(15,15,15,1)_60%,_rgba(0,0,0,1))]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Gold Smith
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
              A simple app starter with auth already wired in.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
              Use the approved email and password login flow to get into the
              protected dashboard with almost no friction.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background"
              >
                Sign in
              </a>
              <a
                href="/dashboard"
                className="inline-flex h-11 items-center justify-center rounded-md border px-5 text-sm font-medium"
              >
                View dashboard
              </a>
            </div>
          </section>

          <section className="rounded-3xl border bg-card p-8 shadow-sm md:p-10">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Included in this build
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>MongoDB-backed users, roles, permissions, and sessions</li>
                <li>Protected dashboard and logout flow</li>
                <li>Minimal UI so you can build on top quickly</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
