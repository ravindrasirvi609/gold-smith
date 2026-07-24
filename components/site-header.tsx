import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { SiteDesktopNavigation, SiteMobileNavigation } from "@/components/site-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl flex-col gap-4 px-6 py-3 md:h-16 md:flex-row md:items-center md:justify-between md:gap-6 md:py-0">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-foreground text-sm text-background">
              GS
            </span>
            <span>Gold Smith</span>
          </Link>

          {session ? <SiteMobileNavigation /> : null}
        </div>

        <div className="flex items-center justify-between gap-4">
          {session ? (
            <>
              <div className="hidden md:block">
                <SiteDesktopNavigation />
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium leading-none">
                    {session.firstName} {session.lastName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{session.email}</p>
                </div>
                <ThemeToggle />
                <LogoutButton />
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
