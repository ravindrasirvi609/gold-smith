"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";

/**
 * A reusable toolbar that lives at the top of every list page.
 *
 * It reads the current URL search params, lets the user type into a
 * debounced search box, optionally shows a status <select>, and pushes
 * the resulting query back into the URL. Server components re-render
 * with the new params via Next.js's built-in navigation.
 */

export type StatusOption = { label: string; value: string };

type ListToolbarProps = {
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Field name for status filter. Omit to hide the status select. */
  statusOptions?: StatusOption[];
  /** Label for the status select. */
  statusLabel?: string;
};

const DEBOUNCE_MS = 300;

export function ListToolbar({
  searchPlaceholder = "Search…",
  statusOptions,
  statusLabel = "Status",
}: ListToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const urlQ = params.get("q") ?? "";
  const urlStatus = params.get("status") ?? "";

  // Search input has its own controlled state so we can debounce URL
  // pushes without dropping keystrokes. The status select pushes on
  // change so it reads directly from the URL.
  const [q, setQ] = useState(urlQ);
  const [isPending, startTransition] = useTransition();

  // Debounced push to URL when local input differs from URL state.
  useEffect(() => {
    if (urlQ === q) return;
    const handle = setTimeout(() => {
      updateParams({ q, page: "1" });
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, urlQ]);

  function updateParams(next: Record<string, string | null>) {
    const merged = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v) merged.delete(k);
      else merged.set(k, v);
    }
    startTransition(() => {
      router.push(`${pathname}?${merged.toString()}`);
    });
  }

  function handleStatus(value: string) {
    updateParams({ status: value || null, page: "1" });
  }

  function clearAll() {
    setQ("");
    startTransition(() => {
      router.push(pathname);
    });
  }

  const hasFilters = urlQ || urlStatus;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/60 p-3 sm:flex-row sm:items-end">
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="list-search" className="text-xs text-muted-foreground">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="list-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-busy={isPending}
          />
        </div>
      </div>

      {statusOptions ? (
        <div className="space-y-1.5 sm:w-52">
          <Label
            htmlFor="list-status"
            className="text-xs text-muted-foreground"
          >
            {statusLabel}
          </Label>
          <NativeSelect
            id="list-status"
            value={urlStatus}
            onChange={(e) => handleStatus(e.target.value)}
          >
            <option value="">All</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect>
        </div>
      ) : null}

      {hasFilters ? (
        <Button variant="ghost" onClick={clearAll} className="sm:self-end">
          <X className="mr-1 size-4" /> Reset
        </Button>
      ) : null}
    </div>
  );
}
