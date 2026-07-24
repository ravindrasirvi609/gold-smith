import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SectionCard — a titled, framed block that groups related form fields.
 *
 * Replaces the flat 20-field grid that vendor / customer / karigar forms
 * used to render. A form now looks like:
 *
 *   <SectionCard icon={UserRound} title="Identity"
 *     description="Who is this customer?">
 *     <FormField … /> <FormField … /> <FormField … />
 *   </SectionCard>
 *   <SectionCard icon={Phone} title="How to reach them">…</SectionCard>
 *
 * `columns` controls the internal grid — sections with dense data use 2
 * columns, sections with wide fields (address, remarks) use 1.
 */

type SectionCardProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  columns?: 1 | 2 | 3;
  className?: string;
  children: React.ReactNode;
  /** Optional slot rendered at the top-right (a button, a status pill…). */
  headerRight?: React.ReactNode;
};

const columnClasses: Record<1 | 2 | 3, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
};

export function SectionCard({
  title,
  description,
  icon: Icon,
  columns = 2,
  className,
  headerRight,
  children,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm",
        className
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border/60 bg-muted/30 px-5 py-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
              <Icon className="size-4" />
            </span>
          ) : null}
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {description ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {headerRight ? <div className="shrink-0">{headerRight}</div> : null}
      </header>
      <div className={cn("grid gap-4 p-5", columnClasses[columns])}>
        {children}
      </div>
    </section>
  );
}
