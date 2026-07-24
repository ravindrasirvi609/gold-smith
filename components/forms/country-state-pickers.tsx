"use client";

import { useState } from "react";
import { Combobox } from "@/components/forms/combobox";
import { Input } from "@/components/ui/input";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  statesForCountry,
  type CountryCode,
} from "@/lib/reference-data";

/**
 * Country / state pickers. Both are dual-mode:
 *
 *  - **Controlled** — the parent passes `value` + `onChange` and drives
 *    the picker (used inside multi-step forms where country and state
 *    live in the same state object).
 *
 *  - **Uncontrolled** — the parent passes `defaultValue` only; the
 *    picker manages its own state. Handy for simple forms that just
 *    want the hidden input written into FormData.
 *
 * The state picker's option list is derived from the current country.
 * If the country doesn't have a shipped list, the state picker falls
 * back to a free-text input so the user isn't blocked.
 */

// ---------------------------------------------------------------------------
// Country
// ---------------------------------------------------------------------------

type CountryPickerProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export function CountryPicker({
  name = "country",
  value,
  defaultValue = DEFAULT_COUNTRY,
  onChange,
  id,
  disabled,
  invalid,
}: CountryPickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue);
  const current = isControlled ? (value as string) : internal;

  return (
    <Combobox
      id={id}
      name={name}
      value={current}
      onChange={(next) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      }}
      options={COUNTRIES}
      placeholder="Select a country"
      searchPlaceholder="Search countries…"
      disabled={disabled}
      invalid={invalid}
    />
  );
}

// ---------------------------------------------------------------------------
// State — dependent on country
// ---------------------------------------------------------------------------

type StatePickerProps = {
  name?: string;
  country: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  id?: string;
  disabled?: boolean;
  invalid?: boolean;
};

export function StatePicker({
  name = "state",
  country,
  value,
  defaultValue = "",
  onChange,
  id,
  disabled,
  invalid,
}: StatePickerProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState<string>(defaultValue);
  const current = isControlled ? (value as string) : internal;

  const options = statesForCountry(country as CountryCode);

  if (!options.length) {
    return (
      <Input
        id={id}
        name={name}
        value={current}
        onChange={(event) => {
          if (!isControlled) setInternal(event.target.value);
          onChange?.(event.target.value);
        }}
        placeholder="Enter state / province"
        disabled={disabled}
        aria-invalid={invalid || undefined}
      />
    );
  }

  return (
    <Combobox
      id={id}
      name={name}
      value={current}
      onChange={(next) => {
        if (!isControlled) setInternal(next);
        onChange?.(next);
      }}
      options={options}
      placeholder="Select a state"
      searchPlaceholder="Search states…"
      disabled={disabled}
      invalid={invalid}
    />
  );
}
