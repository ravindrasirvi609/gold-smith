import Link from "next/link";

const highlights = [
  "Elegant gold and diamond collections",
  "Made-to-order craftsmanship",
  "Trusted for daily retail operations",
];

const services = [
  {
    title: "Bespoke jewellery",
    description:
      "Custom designs crafted around your story, with refined finishing and careful attention to detail.",
  },
  {
    title: "Wedding & gifting",
    description:
      "Statement pieces and timeless sets for special occasions, weddings, and memorable celebrations.",
  },
  {
    title: "Maintenance & care",
    description:
      "Polishing, resizing, and repair support that helps treasured pieces stay beautiful for years.",
  },
];

const assurances = [
  "Premium craftsmanship",
  "Transparent customer care",
  "Thoughtful after-sales support",
  "Beautifully curated collections",
];

const steps = [
  {
    step: "01",
    title: "Discover",
    description:
      "Explore classic essentials, contemporary designs, and custom possibilities curated for every occasion.",
  },
  {
    step: "02",
    title: "Design",
    description:
      "Share your preference, inspiration, and budget so the right piece can be shaped with clarity and confidence.",
  },
  {
    step: "03",
    title: "Deliver",
    description:
      "Receive a finished piece with the detail, polish, and presentation expected from a modern luxury brand.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,247,235,0.95),_rgba(250,250,248,1)_45%,_rgba(237,236,232,1)_100%)] text-foreground dark:bg-[radial-gradient(circle_at_top,_rgba(66,49,20,0.55),_rgba(15,15,15,1)_55%,_rgba(3,3,3,1)_100%)]">
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[40rem] bg-[radial-gradient(circle_at_top_right,_rgba(180,138,63,0.18),_transparent_55%),radial-gradient(circle_at_top_left,_rgba(110,84,31,0.14),_transparent_50%)]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl gap-14 px-6 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-20">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground backdrop-blur">
              Gold Smith
            </div>

            <div className="space-y-5">
              <h1 className="max-w-2xl text-5xl font-semibold tracking-tight md:text-7xl">
                Jewellery designed to feel refined, timeless, and personal.
              </h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg">
                Gold Smith brings together craftsmanship, curation, and modern
                service to create a polished jewellery experience for everyday
                elegance, special moments, and custom orders.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
              >
                Shop with us
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background/80 px-6 text-sm font-medium transition-colors hover:bg-muted/60"
              >
                Explore collections
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border/70 bg-background/80 p-4 text-sm text-muted-foreground shadow-sm backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-[2rem] bg-[linear-gradient(135deg,rgba(255,255,255,0.55),rgba(255,255,255,0.05))] blur-3xl dark:bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.12)] backdrop-blur md:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-amber-100 via-amber-50 to-white p-6 text-foreground shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Signature style
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    Crafted with grace
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Balanced forms, precise finishing, and an elevated look for
                    modern tastes.
                  </p>
                </div>

                <div className="rounded-3xl border border-border/70 bg-background/80 p-6 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
                    Service promise
                  </p>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">
                    Personal attention
                  </p>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Warm guidance, clear communication, and care that continues
                    beyond the purchase.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border border-border/70 bg-background/85 p-5">
                <p className="text-sm font-medium text-foreground">Why customers choose Gold Smith</p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {assurances.map((item) => (
                    <div key={item} className="rounded-2xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60 bg-background/40">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-16 md:grid-cols-3">
          {services.map((item) => (
            <article key={item.title} className="rounded-3xl border border-border/70 bg-card/80 p-6 shadow-sm">
              <h2 className="text-xl font-semibold tracking-tight">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border/60 bg-muted/20">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-4">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
                The experience
              </p>
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                A premium jewellery house with a calm, modern feel.
              </h2>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                From first glance to final delivery, the Gold Smith experience
                is built around trust, clarity, and a refined sense of style.
                Everything is presented to feel easy, elegant, and memorable.
              </p>
            </div>

            <div className="grid gap-4">
              {steps.map((item) => (
                <div key={item.step} className="flex gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Visit Gold Smith
            </p>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to explore something beautiful?
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              Visit the store, browse the collection, or speak with the team
              for guidance on a custom piece that feels truly yours.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted/60"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
