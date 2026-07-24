"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * FormActions — the sticky footer row shared by every form.
 *
 * Left side: an optional inline error/status banner.
 * Right side: Cancel button, primary Save button, and (only in edit mode)
 * a destructive Delete button on the far left.
 *
 * We keep this in one component so button spacing, tone, and disabled
 * states stay identical everywhere.
 *
 *   <FormActions
 *     loading={loading}
 *     saveLabel="Save vendor"
 *     onCancel={() => router.back()}
 *     onDelete={canDelete ? onDelete : undefined}
 *   />
 */

type FormActionsProps = {
  loading?: boolean;
  saveLabel?: string;
  savingLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
  onDelete?: () => void;
  deleteLabel?: string;
  /** Extra buttons rendered between Cancel and Save (e.g. "Save & add another"). */
  extra?: React.ReactNode;
  className?: string;
  /** Sticks to the bottom of the viewport when true. */
  sticky?: boolean;
};

export function FormActions({
  loading = false,
  saveLabel = "Save",
  savingLabel = "Saving…",
  onCancel,
  cancelLabel = "Cancel",
  onDelete,
  deleteLabel = "Delete",
  extra,
  className,
  sticky = false,
}: FormActionsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-5 py-3 shadow-sm",
        sticky && "sticky bottom-4 z-10",
        className
      )}
    >
      <div>
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={loading}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {deleteLabel}
          </Button>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {extra}
        {onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
        ) : null}
        <Button type="submit" disabled={loading}>
          {loading ? savingLabel : saveLabel}
        </Button>
      </div>
    </div>
  );
}
