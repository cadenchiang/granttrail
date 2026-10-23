/**
 * Inline citation chip. Hover, focus or tap shows the record behind a claim.
 * Unknown ids render as a red "missing source" chip instead of disappearing.
 */
"use client";

import { useState } from "react";
import { resolveCitation, type CitationContext } from "@/lib/citations";
import { SourceMark } from "./primitives";

/**
 * @param id citation id (evidence, transaction, "award:..." or "ledger")
 * @param n display number within the report
 */
export function Citation({ id, n, ctx }: { id: string; n?: number; ctx: CitationContext }) {
  const [open, setOpen] = useState(false);
  const c = resolveCitation(id, ctx);
  if (!c) {
    return <span className="ml-0.5 rounded bg-bad-bg px-1 text-[10px] font-semibold text-bad" title={`Missing source: ${id}`}>missing source</span>;
  }
  return (
    <span className="relative inline-block align-baseline" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Source: ${c.label}`}
        className="ml-0.5 inline-flex items-center gap-1 rounded border border-border bg-surface-2 px-1 py-px align-[1px] text-[10px] font-medium text-muted hover:border-text hover:text-text"
      >
        <SourceMark source={c.source} size={11} />
        {n ?? ""}
      </button>
      {open && (
        <span role="tooltip" className="absolute bottom-full left-0 z-20 mb-1.5 w-64 rounded-lg border border-border bg-surface p-2.5 text-left text-xs shadow-lg">
          <span className="flex items-center gap-1.5 font-medium text-text"><SourceMark source={c.source} size={14} />{c.label}</span>
          <span className="mt-1 block text-muted">{c.detail}</span>
        </span>
      )}
    </span>
  );
}
