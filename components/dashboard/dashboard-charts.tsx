"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

type SalesPoint = { label: string; sales: number; purchases: number };
type PiePoint = { label: string; value: number };

const salesConfig = {
  sales: { label: "Sales", color: "hsl(38 92% 50%)" },
  purchases: { label: "Purchases", color: "hsl(220 13% 46%)" },
} as const;

const inventoryConfig = {
  value: { label: "Value", color: "hsl(38 92% 50%)" },
} as const;

export function DashboardCharts({
  salesVsPurchase,
  inventoryMix,
  approvalsByStatus,
}: {
  salesVsPurchase: SalesPoint[];
  inventoryMix: PiePoint[];
  approvalsByStatus: PiePoint[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Sales & Purchase Charts</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Daily flow</h2>
        </div>
        <ChartContainer config={salesConfig} className="h-[320px] w-full">
          <LineChart data={salesVsPurchase} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="var(--color-sales)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="purchases" stroke="var(--color-purchases)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ChartContainer>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Gold & Diamond Inventory</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Current mix</h2>
        </div>
        <ChartContainer config={inventoryConfig} className="h-[320px] w-full">
          <BarChart data={inventoryMix} margin={{ left: 12, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="var(--color-value)">
              {inventoryMix.map((entry) => (
                <Cell key={entry.label} fill={entry.label === "Gold" ? "hsl(38 92% 50%)" : entry.label === "Diamond" ? "hsl(199 89% 48%)" : "hsl(43 74% 49%)"} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm xl:col-span-2">
        <div className="mb-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Pending Approvals</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">Status distribution</h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={approvalsByStatus} dataKey="value" nameKey="label" innerRadius={72} outerRadius={108} paddingAngle={3}>
                  {approvalsByStatus.map((entry, index) => (
                    <Cell
                      key={entry.label}
                      fill={[
                        "hsl(38 92% 50%)",
                        "hsl(220 13% 46%)",
                        "hsl(142 76% 36%)",
                        "hsl(199 89% 48%)",
                        "hsl(0 84% 60%)",
                        "hsl(262 83% 58%)",
                      ][index % 6]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {approvalsByStatus.map((item, index) => (
              <div key={item.label} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">Approval status #{index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
