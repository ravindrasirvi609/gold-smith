"use client";

import { forwardRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/formatters";

/**
 * DateInput — a thin wrapper around a native `<input type="date">` that
 * adds two small polish items:
 *
 *  1. `today` / `pastOnly` / `futureOnly` presets, which translate into
 *     `min` / `max` attributes so the browser picker won't offer invalid
 *     dates (DOB in the future, expected delivery in the past, etc.).
 *
 *  2. A subtle read-out below the input in "24 Jul 2026" style so the
 *     user can double-check the picked date without decoding YYYY-MM-DD.
 *
 * The value written into FormData is always ISO (YYYY-MM-DD) — server
 * code doesn't need to reparse locale strings.
 */

type DateInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  name: string;
  value?: string;
  defaultValue?: string;
  /** Called with the raw ISO string on change. */
  onValueChange?: (value: string) => void;

  /** Constrain the pickable range with one of these presets. */
  pastOnly?: boolean;
  futureOnly?: boolean;

  /** Explicit min / max — override the presets when set. */
  min?: string;
  max?: string;

  /** Hide the "Selected: 24 Jul 2026" caption. */
  hideReadout?: boolean;
};

function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  function DateInput(
    {
      name,
      value,
      defaultValue,
      onValueChange,
      pastOnly,
      futureOnly,
      min,
      max,
      hideReadout,
      className,
      ...rest
    },
    ref
  ) {
    const [minAttr, maxAttr] = useMemo(() => {
      const t = today();
      let effMin = min;
      let effMax = max;
      if (pastOnly && !effMax) effMax = t;
      if (futureOnly && !effMin) effMin = t;
      return [effMin, effMax];
    }, [min, max, pastOnly, futureOnly]);

    const readout = value ?? defaultValue ?? "";

    return (
      <div>
        <Input
          ref={ref}
          type="date"
          name={name}
          value={value}
          defaultValue={defaultValue}
          min={minAttr}
          max={maxAttr}
          className={cn("tabular-nums", className)}
          onChange={(event) => onValueChange?.(event.target.value)}
          {...rest}
        />
        {!hideReadout && readout ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatDate(readout, "long")}
          </p>
        ) : null}
      </div>
    );
  }
);
