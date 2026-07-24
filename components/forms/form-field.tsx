"use client";

import { forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * FormField — every form input in the app renders inside one of these.
 *
 * It gives us a single place to keep label + input + hint + error styling
 * consistent, and prevents forms from becoming a soup of `<div className="space-y-2">`
 * everywhere. Pass any React node as the children — it's wired up to a
 * shared `id` so labels and inputs are properly linked for accessibility.
 *
 *   <FormField label="Company name" hint="As shown on the GST certificate">
 *     <Input name="companyName" placeholder="Kalyan Gold & Diamonds" />
 *   </FormField>
 *
 * Errors (either from server-side validation or client-side) show as a red
 * caption directly under the input, with an icon. When `required` is set
 * the label gets a subtle asterisk.
 */

type FormFieldProps = {
  label: string;
  /** Short guidance shown under the label. */
  hint?: string;
  /** Error message shown under the input in destructive tone. */
  error?: string;
  /** Marks the label with * and sets aria-required on the child. */
  required?: boolean;
  /** Additional text or badge shown at the right of the label row. */
  labelExtra?: React.ReactNode;
  /** Optional class name for the wrapper. */
  className?: string;
  /** The input, textarea, or custom picker. */
  children: React.ReactNode;
  /** Explicit id to bind the label to. If omitted, one is auto-generated
   * and passed to the child via `htmlFor`. Callers that pass their own
   * input can wire this up manually. */
  htmlFor?: string;
};

export const FormField = forwardRef<HTMLDivElement, FormFieldProps>(
  function FormField(
    { label, hint, error, required, labelExtra, className, htmlFor, children },
    ref
  ) {
    const autoId = useId();
    const fieldId = htmlFor ?? `field-${autoId}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const hintId = hint ? `${fieldId}-hint` : undefined;

    return (
      <div ref={ref} className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={fieldId} className="text-sm font-medium">
            {label}
            {required ? (
              <span aria-hidden="true" className="ml-0.5 text-destructive">
                *
              </span>
            ) : null}
          </Label>
          {labelExtra ? (
            <span className="text-xs text-muted-foreground">{labelExtra}</span>
          ) : null}
        </div>
        {hint ? (
          <p id={hintId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        ) : null}
        <div>{children}</div>
        {error ? (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-destructive"
          >
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>
    );
  }
);
