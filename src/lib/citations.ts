/**
 * Resolves citation ids used in the report draft to human-readable sources.
 * Id forms: evidence id ("e4"), transaction id ("t7"), "award:<section>", "ledger".
 */
import { formatDate, formatUSD } from "./format";
import type { Award, Evidence, Source, Transaction } from "./types";

export interface ResolvedCitation {
  id: string;
  source: Source | "award";
  label: string;
  detail: string;
}

export interface CitationContext {
  award: Award;
  evidence: Evidence[];
  transactions: Transaction[];
}

const SOURCE_NAMES: Record<Source, string> = { github: "GitHub", linear: "Linear", docs: "Google Docs", ramp: "Ramp" };

/** Display name for a source, e.g. "docs" -> "Google Docs". */
export function sourceName(source: Source | "award"): string {
  return source === "award" ? "Award" : SOURCE_NAMES[source];
}

/**
 * Look up a citation id.
 * @returns the resolved source, or null when the id points at nothing (callers must
 *          treat that as a broken citation, never silently drop it)
 */
export function resolveCitation(id: string, ctx: CitationContext): ResolvedCitation | null {
  if (id === "ledger") {
    return {
      id, source: "ramp", label: "Ramp ledger",
      detail: `${ctx.transactions.length} transactions coded to award ${ctx.award.awardNumber}`,
    };
  }
  if (id.startsWith("award:")) {
    return { id, source: "award", label: `Award, ${id.slice(6)}`, detail: `${ctx.award.agency} ${ctx.award.program} ${ctx.award.awardNumber}` };
  }
  const e = ctx.evidence.find((x) => x.id === id);
  if (e) return { id, source: e.source, label: e.ref, detail: `${e.title} · ${e.author} · ${formatDate(e.date)}` };
  const t = ctx.transactions.find((x) => x.id === id);
  if (t) return { id, source: "ramp", label: `${t.merchant} ${formatUSD(t.amount)}`, detail: `${t.memo} · ${formatDate(t.date)}` };
  return null;
}
