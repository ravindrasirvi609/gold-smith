"use client";

import { forwardRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toNumber, type WeightUnit } from "@/lib/formatters";

/**
 * Numeric inputs for money and weight.
 *
 * Both share a common structure — a Unit prefix or suffix, right-aligned
 * tabular numerals, and a controlled state that keeps the raw value the
 * user typed while emitting a normalised numeric string via the parent
 * form. On blur they can optionally reformat.
 *
 * These are *not* client-side calculators — they submit the plain number
 * to the server, which stays authoritative for pricing.
 */

type NumericProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "onChange" | "value" | "defaultValue"
> & {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Max fractional digits accepted. Everything past this is trimmed. */
  precision?: number;
  /** Prevent negative numbers (default true). */
  positiveOnly?: boolean;
};

// ---------------------------------------------------------------------------
// Money — ₹ prefix, 2 decimals
// ---------------------------------------------------------------------------

export const MoneyInput = forwardRef<HTMLInputElement, NumericProps>(
  function MoneyInput(
    {
      value,
      defaultValue,
      onValueChange,
      precision = 2,
      positiveOnly = true,
      className,
      ...rest
    },
    ref
  ) {
    const [internal, setInternal] = useState(
      normaliseNumeric(value ?? defaultValue ?? "", precision, positiveOnly)
    );
    const current = value !== undefined ? String(value) : internal;

    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          ₹
        </div>
        <Input
          ref={ref}
          {...rest}
          value={current}
          inputMode="decimal"
          placeholder="0.00"
          className={cn("pl-7 text-right tabular-nums", className)}
          onChange={(event) => {
            const next = normaliseNumeric(
              event.target.value,
              precision,
              positiveOnly
            );
            setInternal(next);
            onValueChange?.(next);
          }}
          onBlur={(event) => {
            const parsed = toNumber(event.target.value);
            const formatted =
              event.target.value === ""
                ? ""
                : parsed.toFixed(precision);
            setInternal(formatted);
            onValueChange?.(formatted);
            rest.onBlur?.(event);
          }}
        />
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Weight — unit suffix, 3 decimals by default
// ---------------------------------------------------------------------------

type WeightInputProps = NumericProps & {
  unit?: WeightUnit;
};

export const WeightInput = forwardRef<HTMLInputElement, WeightInputProps>(
  function WeightInput(
    {
      value,
      defaultValue,
      onValueChange,
      precision,
      positiveOnly = true,
      unit = "g",
      className,
      ...rest
    },
    ref
  ) {
    const digits = precision ?? (unit === "pcs" ? 0 : 3);
    const [internal, setInternal] = useState(
      normaliseNumeric(value ?? defaultValue ?? "", digits, positiveOnly)
    );
    const current = value !== undefined ? String(value) : internal;

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...rest}
          value={current}
          inputMode="decimal"
          placeholder={unit === "pcs" ? "0" : "0." + "0".repeat(digits)}
          className={cn("pr-10 text-right tabular-nums", className)}
          onChange={(event) => {
            const next = normaliseNumeric(
              event.target.value,
              digits,
              positiveOnly
            );
            setInternal(next);
            onValueChange?.(next);
          }}
          onBlur={(event) => {
            const parsed = toNumber(event.target.value);
            const formatted =
              event.target.value === "" ? "" : parsed.toFixed(digits);
            setInternal(formatted);
            onValueChange?.(formatted);
            rest.onBlur?.(event);
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
          {unit}
        </div>
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Percent — 0..100, "%" suffix
// ---------------------------------------------------------------------------

export const PercentInput = forwardRef<HTMLInputElement, NumericProps>(
  function PercentInput(
    {
      value,
      defaultValue,
      onValueChange,
      precision = 2,
      className,
      ...rest
    },
    ref
  ) {
    const [internal, setInternal] = useState(
      normaliseNumeric(value ?? defaultValue ?? "", precision, true)
    );
    const current = value !== undefined ? String(value) : internal;

    return (
      <div className="relative">
        <Input
          ref={ref}
          {...rest}
          value={current}
          inputMode="decimal"
          placeholder="0"
          className={cn("pr-8 text-right tabular-nums", className)}
          onChange={(event) => {
            let next = normaliseNumeric(event.target.value, precision, true);
            const asNumber = toNumber(next);
            if (asNumber > 100) next = "100";
            setInternal(next);
            onValueChange?.(next);
          }}
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground">
          %
        </div>
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normaliseNumeric(
  raw: unknown,
  precision: number,
  positiveOnly: boolean
): string {
  let text = String(raw ?? "").trim();
  if (!text) return "";
  if (!positiveOnly && text.startsWith("-")) {
    text = "-" + text.slice(1).replace(/[^0-9.]/g, "");
  } else {
    text = text.replace(/[^0-9.]/g, "");
  }
  // Only one decimal point
  const firstDot = text.indexOf(".");
  if (firstDot !== -1) {
    text =
      text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, "");
  }
  // Trim to precision
  if (precision === 0) {
    text = text.split(".")[0];
  } else if (firstDot !== -1) {
    const [intPart, fracPart = ""] = text.split(".");
    text = intPart + "." + fracPart.slice(0, precision);
  }
  return text;
}
