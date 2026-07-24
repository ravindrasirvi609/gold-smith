"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm shadow-sm hover:bg-neutral-50"
    >
      <Printer className="size-4" /> Print / Save as PDF
    </button>
  );
}
