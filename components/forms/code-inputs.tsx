"use client";

import { forwardRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  AADHAAR_REGEX,
  GST_REGEX,
  IFSC_REGEX,
  INDIAN_MOBILE_REGEX,
  PAN_REGEX,
  PINCODE_REGEX,
} from "@/lib/reference-data";
import { normaliseCode } from "@/lib/formatters";

/**
 * Smart, self-formatting inputs for Indian tax and banking identifiers.
 *
 * Each variant:
 *  - Enforces uppercase / digit-only input as the user types.
 *  - Caps the length at the correct number of characters.
 *  - Shows a green check when the value matches the format regex.
 *  - Uses `aria-invalid` on partial values so `FormField`'s error slot
 *    can render an inline error underneath.
 *
 * Values are always stored in the canonical form — no spaces, all caps
 * where relevant — so downstream code (audit trail, tax reports) doesn't
 * have to re-normalise later.
 */

type BaseInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "onChange" | "value" | "defaultValue"
> & {
  name: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  showValidTick?: boolean;
};

// ---------------------------------------------------------------------------
// GST — 22AAAAA0000A1Z5 (15 chars)
// ---------------------------------------------------------------------------

export const GstInput = forwardRef<HTMLInputElement, BaseInputProps>(
  function GstInput(
    { value, defaultValue, onValueChange, showValidTick = true, ...rest },
    ref
  ) {
    const [internal, setInternal] = useState(
      normaliseCode(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? normaliseCode(value) : internal;
    const isValid = GST_REGEX.test(current);
    return (
      <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
        <Input
          ref={ref}
          {...rest}
          value={current}
          maxLength={15}
          inputMode="text"
          autoComplete="off"
          placeholder="22AAAAA0000A1Z5"
          aria-invalid={current.length > 0 && !isValid}
          onChange={(event) => {
            const next = normaliseCode(event.target.value).slice(0, 15);
            setInternal(next);
            onValueChange?.(next);
          }}
        />
      </TickWrapper>
    );
  }
);

// ---------------------------------------------------------------------------
// PAN — 5 alpha + 4 numeric + 1 alpha (10 chars)
// ---------------------------------------------------------------------------

export const PanInput = forwardRef<HTMLInputElement, BaseInputProps>(
  function PanInput(
    { value, defaultValue, onValueChange, showValidTick = true, ...rest },
    ref
  ) {
    const [internal, setInternal] = useState(
      normaliseCode(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? normaliseCode(value) : internal;
    const isValid = PAN_REGEX.test(current);
    return (
      <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
        <Input
          ref={ref}
          {...rest}
          value={current}
          maxLength={10}
          inputMode="text"
          autoComplete="off"
          placeholder="ABCDE1234F"
          aria-invalid={current.length > 0 && !isValid}
          onChange={(event) => {
            const next = normaliseCode(event.target.value).slice(0, 10);
            setInternal(next);
            onValueChange?.(next);
          }}
        />
      </TickWrapper>
    );
  }
);

// ---------------------------------------------------------------------------
// Aadhaar — 12 digits, formatted as 1234 5678 9012 while typing
// ---------------------------------------------------------------------------

export const AadhaarInput = forwardRef<HTMLInputElement, BaseInputProps>(
  function AadhaarInput(
    { value, defaultValue, onValueChange, showValidTick = true, ...rest },
    ref
  ) {
    const [internal, setInternal] = useState(
      digitsOnly(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? digitsOnly(value) : internal;
    const isValid = AADHAAR_REGEX.test(current);
    return (
      <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
        <Input
          ref={ref}
          {...rest}
          value={formatSpacedDigits(current, 4)}
          maxLength={14}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1234 5678 9012"
          aria-invalid={current.length > 0 && !isValid}
          onChange={(event) => {
            const next = digitsOnly(event.target.value).slice(0, 12);
            setInternal(next);
            onValueChange?.(next);
          }}
        />
      </TickWrapper>
    );
  }
);

// ---------------------------------------------------------------------------
// IFSC — 4 alpha + 0 + 6 alphanumeric (11 chars)
// ---------------------------------------------------------------------------

export const IfscInput = forwardRef<HTMLInputElement, BaseInputProps>(
  function IfscInput(
    { value, defaultValue, onValueChange, showValidTick = true, ...rest },
    ref
  ) {
    const [internal, setInternal] = useState(
      normaliseCode(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? normaliseCode(value) : internal;
    const isValid = IFSC_REGEX.test(current);
    return (
      <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
        <Input
          ref={ref}
          {...rest}
          value={current}
          maxLength={11}
          inputMode="text"
          autoComplete="off"
          placeholder="SBIN0001234"
          aria-invalid={current.length > 0 && !isValid}
          onChange={(event) => {
            const next = normaliseCode(event.target.value).slice(0, 11);
            setInternal(next);
            onValueChange?.(next);
          }}
        />
      </TickWrapper>
    );
  }
);

// ---------------------------------------------------------------------------
// Pincode — 6 digits
// ---------------------------------------------------------------------------

export const PincodeInput = forwardRef<HTMLInputElement, BaseInputProps>(
  function PincodeInput(
    { value, defaultValue, onValueChange, showValidTick = true, ...rest },
    ref
  ) {
    const [internal, setInternal] = useState(
      digitsOnly(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? digitsOnly(value) : internal;
    const isValid = PINCODE_REGEX.test(current);
    return (
      <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
        <Input
          ref={ref}
          {...rest}
          value={current}
          maxLength={6}
          inputMode="numeric"
          autoComplete="postal-code"
          placeholder="560001"
          aria-invalid={current.length > 0 && !isValid}
          onChange={(event) => {
            const next = digitsOnly(event.target.value).slice(0, 6);
            setInternal(next);
            onValueChange?.(next);
          }}
        />
      </TickWrapper>
    );
  }
);

// ---------------------------------------------------------------------------
// Mobile — 10 digits (India). Country code shown as prefix, editable.
// ---------------------------------------------------------------------------

export type MobileInputProps = Omit<BaseInputProps, "prefix"> & {
  /** ISO or dial-code prefix shown to the left. Defaults to +91. */
  countryCode?: string;
};

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  function MobileInput(
    {
      value,
      defaultValue,
      onValueChange,
      showValidTick = true,
      countryCode = "+91",
      className,
      ...rest
    },
    ref
  ) {
    const [internal, setInternal] = useState(
      digitsOnly(value ?? defaultValue ?? "")
    );
    const current = value !== undefined ? digitsOnly(value) : internal;
    const isValid = INDIAN_MOBILE_REGEX.test(current);
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
          {countryCode}
        </div>
        <TickWrapper valid={isValid} show={showValidTick && current.length > 0}>
          <Input
            ref={ref}
            {...rest}
            value={current}
            maxLength={10}
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            className={cn("pl-14", className)}
            aria-invalid={current.length > 0 && !isValid}
            onChange={(event) => {
              const next = digitsOnly(event.target.value).slice(0, 10);
              setInternal(next);
              onValueChange?.(next);
            }}
          />
        </TickWrapper>
      </div>
    );
  }
);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function digitsOnly(value: unknown): string {
  return String(value ?? "").replace(/\D+/g, "");
}

function formatSpacedDigits(value: string, group: number): string {
  const parts: string[] = [];
  for (let i = 0; i < value.length; i += group) {
    parts.push(value.slice(i, i + group));
  }
  return parts.join(" ");
}

function TickWrapper({
  valid,
  show,
  children,
}: {
  valid: boolean;
  show: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      {children}
      {show && valid ? (
        <CheckCircle2
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
        />
      ) : null}
    </div>
  );
}
