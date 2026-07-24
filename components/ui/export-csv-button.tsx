"use client";

import { useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

/**
 * Reusable "Export CSV" link, styled as an outline button.
 *
 * Forwards the current search params so the export honours the current
 * search / status / date filters applied on the list page. Rendered as a
 * plain anchor so the browser handles the file download natively.
 */
export function ExportCsvButton({
  endpoint,
  label = "Export CSV",
}: {
  endpoint: string;
  label?: string;
}) {
  const params = useSearchParams();
  const query = params.toString();
  const href = query ? `${endpoint}?${query}` : endpoint;

  return (
    <a
      href={href}
      download
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm transition-colors hover:bg-muted"
    >
      <Download className="size-4" />
      {label}
    </a>
  );
}
