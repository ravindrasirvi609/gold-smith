import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(245,245,245,1)_55%,_rgba(229,231,235,1))] text-foreground dark:bg-[radial-gradient(circle_at_top,_rgba(38,38,38,1),_rgba(15,15,15,1)_60%,_rgba(0,0,0,1))]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <section className="space-y-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Gold Smith
            </p>
            <h1 className="max-w-xl text-4xl font-semibold tracking-tight md:text-6xl">
              Simple sign-in for approved users.
            </h1>
            <p className="max-w-lg text-base leading-7 text-muted-foreground md:text-lg">
              Enter your email and password, then we’ll verify your account
              status, role, and permissions before sending you to the
              dashboard.
            </p>
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full border bg-background/70 px-3 py-1">
                Password auth
              </span>
              <span className="rounded-full border bg-background/70 px-3 py-1">
                Role permissions
              </span>
              <span className="rounded-full border bg-background/70 px-3 py-1">
                JWT session
              </span>
            </div>
            <Link href="/" className="inline-flex text-sm underline underline-offset-4">
              Back to home
            </Link>
          </section>

          <section className="lg:justify-self-end lg:w-full lg:max-w-md">
            <LoginForm />
          </section>
        </div>
      </div>
    </main>
  );
}
