import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, ArrowUpRight, Bell, CheckCircle2, Clock3, Gem, Layers3, Package, ShieldCheck, Sparkles, Store, Users } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { LogoutButton } from "@/components/auth/logout-button";
import { getDashboardData } from "@/lib/admin-dashboard";
import { getSession, hasPermission } from "@/lib/auth";

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const data = await getDashboardData();

  const cards = [
    { label: "Gold Stock", value: `${data.kpis.goldStockKg.toFixed(3)} KG`, icon: Gem },
    { label: "Diamond Stock", value: `${data.kpis.diamondStockCarats.toFixed(0)} Carats`, icon: Sparkles },
    { label: "Total Products", value: `${data.kpis.totalProducts.toLocaleString("en-IN")} Items`, icon: Package },
    { label: "Today's Sales", value: money(data.kpis.todaySales), icon: ArrowUpRight },
    { label: "Today's Purchase", value: money(data.kpis.todayPurchase), icon: Layers3 },
    { label: "Today's Profit", value: money(data.kpis.todayProfit), icon: CheckCircle2 },
    { label: "Pending Orders", value: String(data.kpis.pendingOrders), icon: Clock3 },
    { label: "Pending Approval", value: String(data.kpis.pendingApproval), icon: ShieldCheck },
    { label: "Pending Payments", value: money(data.kpis.pendingPayments), icon: Bell },
    { label: "Active Karigars", value: String(data.kpis.activeKarigars), icon: Users },
    { label: "Customers", value: String(data.kpis.customers), icon: Users },
    { label: "Vendors", value: String(data.kpis.vendors), icon: Store },
  ];

  const quickActions = [
    { href: "/dashboard/approvals", label: "Open approvals", description: "Review pending approval work." },
    { href: "/dashboard/inventory", label: "Inspect inventory", description: "Check gold and diamond movement." },
    { href: "/dashboard/manufacturing", label: "Manufacturing", description: "Track karigar issues and receipts." },
    { href: "/dashboard/customers", label: "Customer master", description: "Manage customer records." },
    { href: "/dashboard/vendors", label: "Vendor master", description: "Manage purchase suppliers." },
    { href: "/dashboard/payments", label: "Payment ledger", description: "Monitor pending collections." },
  ];

  const visibleActions = [
    hasPermission(session, "APPROVAL_VIEW") ? quickActions[0] : null,
    hasPermission(session, "PURCHASE_VIEW") ? quickActions[1] : null,
    hasPermission(session, "ISSUE_VIEW") ? quickActions[2] : null,
    hasPermission(session, "CUSTOMER_VIEW") ? quickActions[3] : null,
    hasPermission(session, "VENDOR_VIEW") ? quickActions[4] : null,
    hasPermission(session, "PAYMENT_VIEW") ? quickActions[5] : null,
  ].filter(Boolean) as typeof quickActions;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(255,241,207,0.7),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(253,224,71,0.2),_transparent_28%),linear-gradient(to_bottom,_rgba(250,248,243,1),_rgba(245,243,238,1))] text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 md:py-12">
        <section className="rounded-[2rem] border border-border/70 bg-background/80 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
                Gold Smith dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                Complete operational overview for sales, stock, approvals, and the workshop.
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-base">
                This page is now powered by server-side aggregations and the same payload is also
                available through `/api/dashboard`, so the numbers, charts, alerts, and activity
                remain consistent across the app.
              </p>
            </div>
          
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.label} className="rounded-3xl border border-border/70 bg-gradient-to-br from-white via-white to-amber-50 p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold tracking-tight">{item.value}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground text-background">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <DashboardCharts
          salesVsPurchase={data.charts.salesVsPurchase}
          inventoryMix={data.charts.inventoryMix}
          approvalsByStatus={data.charts.approvalsByStatus}
        />

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <article className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Gold rate widget</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  {data.goldRate.ratePerGram ? `₹${data.goldRate.ratePerGram.toLocaleString("en-IN")} / gram` : "Not configured"}
                </h2>
              </div>
              <div className="rounded-2xl bg-muted/50 px-4 py-3 text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Source</p>
                <p className="mt-1 text-sm font-medium">{data.goldRate.source}</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {data.quickStats.map((item) => (
                <div key={item.label} className="rounded-2xl bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Customer summary</p>
                <p className="mt-2 text-2xl font-semibold">{data.summaries.customerSummary.total}</p>
                <p className="mt-1 text-sm text-muted-foreground">{data.summaries.customerSummary.blocked} blocked</p>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Vendor summary</p>
                <p className="mt-2 text-2xl font-semibold">{data.summaries.vendorSummary.total}</p>
                <p className="mt-1 text-sm text-muted-foreground">{data.summaries.vendorSummary.blocked} blocked</p>
              </div>
              <div className="rounded-2xl border border-border/70 p-4">
                <p className="text-sm text-muted-foreground">Karigar status</p>
                <p className="mt-2 text-2xl font-semibold">{data.summaries.karigarSummary.active}</p>
                <p className="mt-1 text-sm text-muted-foreground">{data.summaries.karigarSummary.busy} active work items</p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Alerts & notifications</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">What needs attention</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {data.alerts.length ? data.alerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="font-medium">{alert.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                </div>
              )) : <div className="rounded-2xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">No active alerts right now.</div>}
            </div>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <article className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Activity timeline</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Recent events</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {data.timeline.map((item) => (
                <div key={`${item.kind}-${item.title}-${item.time}`} className="flex gap-4 rounded-2xl border border-border/70 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <Clock3 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.time}</p>
                    <h3 className="mt-1 font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Top performers</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Customers, vendors, karigars</h2>
              </div>
            </div>
            <div className="mt-5 grid gap-5">
              {[
                { title: "Top customers", items: data.performers.customers },
                { title: "Top vendors", items: data.performers.vendors },
                { title: "Top karigars", items: data.performers.karigars },
              ].map((group) => (
                <div key={group.title} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-sm font-medium">{group.title}</p>
                  <div className="mt-3 space-y-2">
                    {group.items.length ? group.items.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-4 text-sm">
                        <span className="truncate text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{typeof item.value === "number" ? money(item.value) : item.value}</span>
                      </div>
                    )) : <p className="text-sm text-muted-foreground">No data yet.</p>}
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Quick actions</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">Common next steps</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleActions.map((item) => (
              <Link key={item.href} href={item.href} className="group rounded-2xl border border-border/70 bg-muted/20 p-4 transition-colors hover:bg-muted/50">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
