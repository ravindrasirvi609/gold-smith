"use client";

import { forwardRef } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import type { Option } from "@/lib/reference-data";

/**
 * A styled native `<select>` bound to a reference-data catalog.
 *
 * Preferred over the raw `<select>` for short, closed lists (≤ ~12
 * options) where a native drop-down is faster than a searchable
 * combobox. For anything longer, use `<Combobox>` instead.
 *
 * Renders a real `<select name>` so it fits into any existing FormData
 * flow with zero submit-handler changes.
 *
 *   <ReferenceSelect
 *     name="vendorType"
 *     options={VENDOR_TYPES}
 *     defaultValue="GOLD"
 *   />
 */

type ReferenceSelectProps = {
  name: string;
  options: readonly Option[];
  /** Show a "— None —" first entry with an empty value. */
  includeEmpty?: boolean;
  emptyLabel?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean;
  className?: string;
  /** Optional class name applied to the outer wrapper so callers can size
   *  the control (`w-full`, `sm:w-52`, etc.). */
  wrapperClassName?: string;
};

export const ReferenceSelect = forwardRef<HTMLSelectElement, ReferenceSelectProps>(
  function ReferenceSelect(
    {
      name,
      options,
      includeEmpty,
      emptyLabel = "— Select —",
      defaultValue,
      value,
      onChange,
      id,
      disabled,
      required,
      invalid,
      className,
      wrapperClassName,
    },
    ref
  ) {
    return (
      <NativeSelect
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        id={id}
        name={name}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={invalid || undefined}
        className={cn(
          "w-full",
          invalid && "[&_select]:border-destructive [&_select]:ring-destructive/30",
          wrapperClassName
        )}
        // Inner-select styling extension via a data attribute — see NativeSelect
      >
        {includeEmpty ? <option value="">{emptyLabel}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.hint ? `${option.label} — ${option.hint}` : option.label}
          </option>
        ))}
        {/* An unused className arg to silence unused-var in some tsc modes */}
        {className ? null : null}
      </NativeSelect>
    );
  }
);
