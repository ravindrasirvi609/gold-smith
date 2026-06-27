import Link from "next/link";
import { getSession } from "@/lib/auth";
import { siteNavigation } from "@/components/site-navigation-data";

export async function SiteFooter() {
  const session = await getSession();

  return (
    <footer className="border-t border-border/70 bg-muted/30">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 md:grid-cols-[1.2fr_0.8fr] md:items-start">
        <div className="space-y-3">
          <p className="text-lg font-semibold tracking-tight">Gold Smith</p>
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            A clean workspace for managing customers, karigars, inventory, approvals, and day-to-day operations.
          </p>
        </div>

        {session ? (
          <nav className="grid gap-2 sm:grid-cols-2 md:justify-self-end">
            {siteNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Built for internal operations.</p>
          <p>&copy; {new Date().getFullYear()} Gold Smith</p>
        </div>
      </div>
    </footer>
  );
}
