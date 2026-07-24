"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Option } from "@/lib/reference-data";

/**
 * A searchable dropdown for long lists (vendor / customer / product /
 * karigar pickers, plus any reference-data list with more than about a
 * dozen options).
 *
 * Renders a hidden `<input type="hidden" name={name}>` so it drops into
 * any existing FormData-based submit handler without further wiring —
 * exactly like `<FileUpload>` does. The visible trigger is a plain
 * button that opens a popover with a client-side search box + option
 * list. Options can include an optional `hint` shown as a caption
 * beneath the label.
 *
 *   <Combobox
 *     name="stateCode"
 *     options={INDIAN_STATES}
 *     value={value}
 *     onChange={setValue}
 *     placeholder="Select a state…"
 *   />
 */

type ComboboxOption = Option & {
  /** Free-text keywords for the search index. */
  keywords?: string;
};

type ComboboxProps = {
  /** Name of the hidden input written into the parent form. */
  name?: string;
  /** Current value (controlled). */
  value?: string;
  /** Called with the new value on selection. */
  onChange?: (value: string) => void;
  /** Options to show. */
  options: readonly ComboboxOption[];
  /** Placeholder shown when nothing is selected. */
  placeholder?: string;
  /** Placeholder inside the search input. */
  searchPlaceholder?: string;
  /** Message when the search returns nothing. */
  emptyMessage?: string;
  /** Optional id for accessibility labelling. */
  id?: string;
  /** Optional class name on the trigger button. */
  className?: string;
  /** Disable the whole control. */
  disabled?: boolean;
  /** When true the trigger shows a red ring — pair with FormField's error slot. */
  invalid?: boolean;
};

function normalise(text: unknown): string {
  return String(text ?? "").toLowerCase().trim();
}

export function Combobox({
  name,
  value,
  onChange,
  options,
  placeholder = "Select an option…",
  searchPlaceholder = "Search…",
  emptyMessage = "No results.",
  id,
  className,
  disabled,
  invalid,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => options.find((option) => option.value === value),
    [options, value]
  );

  const filtered = useMemo(() => {
    const q = normalise(query);
    if (!q) return options;
    return options.filter((option) => {
      const haystack = [option.label, option.value, option.hint, option.keywords]
        .filter(Boolean)
        .map(normalise)
        .join(" ");
      return haystack.includes(q);
    });
  }, [options, query]);

  function pick(nextValue: string) {
    onChange?.(nextValue);
    setOpen(false);
    setQuery("");
  }

  return (
    <>
      {name ? (
        <input type="hidden" name={name} value={value ?? ""} />
      ) : null}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={id}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
            "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            invalid && "border-destructive ring-1 ring-destructive/30",
            className
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !selected && "text-muted-foreground"
            )}
          >
            {selected ? (
              <span className="flex flex-col leading-tight">
                <span className="text-sm">{selected.label}</span>
                {selected.hint ? (
                  <span className="text-xs text-muted-foreground">
                    {selected.hint}
                  </span>
                ) : null}
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--anchor-width,320px)] min-w-[240px] p-0"
        >
          <div className="flex items-center border-b border-border/60 px-3">
            <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul
            role="listbox"
            className="max-h-72 overflow-y-auto p-1"
          >
            {filtered.length ? (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    onClick={() => pick(option.value)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none",
                      option.value === value
                        ? "bg-primary/10 text-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 size-4 shrink-0",
                        option.value === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="block truncate text-xs text-muted-foreground">
                          {option.hint}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            )}
          </ul>
          {selected && !disabled ? (
            <div className="flex items-center justify-between border-t border-border/60 px-3 py-2 text-xs text-muted-foreground">
              <span className="truncate">
                Selected: <strong className="text-foreground">{selected.label}</strong>
              </span>
              <button
                type="button"
                onClick={() => pick("")}
                className="text-xs underline underline-offset-4 hover:text-foreground"
              >
                Clear
              </button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
