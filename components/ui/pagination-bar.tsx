"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Server-driven pagination bar. Renders as anchor links that carry the
 * current search params + updated `page` so the browser handles history
 * correctly and Next.js can pre-fetch the neighbouring pages.
 */

type PaginationBarProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  className?: string;
};

const linkClass =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted";
const disabledClass = "pointer-events-none opacity-50";

export function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  className,
}: PaginationBarProps) {
  const pathname = usePathname();
  const params = useSearchParams();

  function hrefFor(target: number) {
    const merged = new URLSearchParams(params.toString());
    merged.set("page", String(target));
    return `${pathname}?${merged.toString()}`;
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <div
      className={cn(
        "flex flex-col-reverse items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3 sm:flex-row",
        className
      )}
    >
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "No results"
          : `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${total.toLocaleString()}`}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={hrefFor(Math.max(1, page - 1))}
          prefetch={false}
          aria-disabled={prevDisabled}
          aria-label="Previous page"
          className={cn(linkClass, prevDisabled && disabledClass)}
        >
          <ChevronLeft className="size-4" />
          <span>Prev</span>
        </Link>
        <span className="text-xs tabular-nums text-muted-foreground">
          Page <strong className="text-foreground">{page}</strong> of{" "}
          {totalPages.toLocaleString()}
        </span>
        <Link
          href={hrefFor(Math.min(totalPages, page + 1))}
          prefetch={false}
          aria-disabled={nextDisabled}
          aria-label="Next page"
          className={cn(linkClass, nextDisabled && disabledClass)}
        >
          <span>Next</span>
          <ChevronRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
