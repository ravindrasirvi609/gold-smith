import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";
import { getSession, hasPermission } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-16">
        <div className="w-full rounded-3xl border bg-card p-8 shadow-sm md:p-10">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-muted-foreground">
              Signed in successfully
            </p>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back.
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
              You are authenticated with the email address below. This page is
              protected by a signed JWT session after email, password, status,
              role, and permissions were checked.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">Signed-in email</h2>
              <p className="mt-2 text-sm text-muted-foreground">{session.email}</p>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">Role</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {session.role.name}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">Permissions</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {session.permissions.length
                  ? session.permissions.join(", ")
                  : "No permissions assigned."}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-5">
              <h2 className="font-medium">What happens next</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your app content here. The auth plumbing is already in
                place.
              </p>
            </div>
            {hasPermission(session, "USER_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">User management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the users page to create or edit users.
                </p>
                <Link
                  href="/dashboard/users"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to users
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "ROLE_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Role management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the roles page to create or edit roles and assign permissions.
                </p>
                <Link
                  href="/dashboard/roles"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to roles
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "PERMISSION_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Permission management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the permissions page to create or edit permission codes.
                </p>
                <Link
                  href="/dashboard/permissions"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to permissions
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "VENDOR_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Vendor management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the vendor master to keep purchase suppliers ready.
                </p>
                <Link
                  href="/dashboard/vendors"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to vendors
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "CUSTOMER_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Customer management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the customer master for billing and approval records.
                </p>
                <Link
                  href="/dashboard/customers"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to customers
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "KARIGAR_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Karigar management</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Open the karigar master for issue, receipt, and labour tracking.
                </p>
                <Link
                  href="/dashboard/karigars"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to karigars
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "PURCHASE_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Purchase & inventory</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Track gold and diamond purchases with ledger-backed stock.
                </p>
                <Link
                  href="/dashboard/inventory"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to inventory
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "ISSUE_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Manufacturing</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage karigar issue, receipt, products, and history.
                </p>
                <Link
                  href="/dashboard/manufacturing"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to manufacturing
                </Link>
              </div>
            ) : null}
            {hasPermission(session, "APPROVAL_VIEW") ? (
              <div className="rounded-2xl border bg-muted/40 p-5">
                <h2 className="font-medium">Sales & finance</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Manage approvals, invoices, payments, settings, and audit logs.
                </p>
                <Link
                  href="/dashboard/sales"
                  className="mt-3 inline-flex text-sm underline underline-offset-4"
                >
                  Go to sales
                </Link>
              </div>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <LogoutButton />
            <Link href="/login" className="inline-flex items-center text-sm underline underline-offset-4">
              Switch account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
