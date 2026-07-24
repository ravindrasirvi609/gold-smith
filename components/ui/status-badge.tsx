import { cn } from "@/lib/utils";
import { findStatus, type StatusOption, type StatusTone } from "@/lib/reference-data";

/**
 * StatusBadge — renders any status value (from any of the module status
 * enums) as a tinted pill. Looks the value up in the reference-data
 * catalog to find its label and tone; unknown values render as a neutral
 * badge showing the raw value.
 *
 *   <StatusBadge status="PAID" />         → green "Paid"
 *   <StatusBadge status="CANCELLED" />    → red "Cancelled"
 *   <StatusBadge status="DRAFT" />        → grey "Draft"
 *
 * The tone→color mapping lives here so every badge in the app stays
 * visually consistent.
 */

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900",
  warning:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900",
  danger:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900",
  info:
    "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-900",
  neutral:
    "bg-muted text-muted-foreground border-border",
};

type StatusBadgeProps = {
  status: string;
  /** Override the auto-lookup with an explicit option. */
  option?: StatusOption;
  className?: string;
};

export function StatusBadge({ status, option, className }: StatusBadgeProps) {
  const resolved = option ?? findStatus(status);
  const tone = resolved?.tone ?? "neutral";
  const label = resolved?.label ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full",
          tone === "success" && "bg-emerald-500",
          tone === "warning" && "bg-amber-500",
          tone === "danger" && "bg-red-500",
          tone === "info" && "bg-sky-500",
          tone === "neutral" && "bg-muted-foreground/60"
        )}
      />
      {label}
    </span>
  );
}
