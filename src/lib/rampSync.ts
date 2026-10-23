/**
 * Pure logic behind the simulated Ramp connection: what the sync "found",
 * the staged sync steps with their counts, and the "sources used" line on the report.
 * Nothing here talks to Ramp; every number comes from the sample data or a named constant.
 */
import { EQUIPMENT_THRESHOLD } from "./flags";
import { formatUSD } from "./format";
import type { Award, BudgetCategory, Evidence, Source, Transaction } from "./types";

/** Workspace-wide transactions the fake sync "scans" before filtering to the award. */
export const RAMP_WORKSPACE_TRANSACTIONS = 1286;
/** Cards and spend programs the fake sync "reads". */
export const RAMP_CARDS_READ = 12;
/** Duration of one sync step; six steps run for about five seconds. */
/** Award agreement and approved proposal found in the Ramp workspace's documents. */
export const RAMP_AWARD_DOCUMENTS = 2;
export const RAMP_SYNC_STEP_MS = 850;

/** Payroll and indirect allocations are journal entries: no receipt, shared across objectives. */
const SHARED_CATEGORIES: BudgetCategory[] = ["Personnel", "Indirect"];

/** What the sync found among transactions coded to the award. */
export interface RampSyncSummary {
  count: number;
  total: number;
  /** Card and bill spend that carries a receipt (everything but payroll and indirect). */
  receipts: number;
  /** Receipts with line items. */
  itemized: number;
  /** Coded to a specific technical objective. */
  mapped: number;
  /** Personnel or indirect, legitimately shared across objectives. */
  shared: number;
  /** No objective and not a shared category, so a person should look at it. */
  needsReview: number;
  /** Equipment line items at or above the federal equipment threshold. */
  equipmentFlagged: number;
  /** Distinct merchants. */
  vendors: number;
}

/**
 * Summarize the transactions coded to the award.
 * @param txs transactions coded to the grant (the sample data in this demo)
 * @returns counts and totals; all zero for an empty list
 * Edge cases: a transaction with no line items counts as a receipt but not itemized;
 * equipment is counted per qualifying line item, so one purchase with two big items counts twice.
 */
export function summarizeRampSync(txs: Transaction[]): RampSyncSummary {
  const shared = (t: Transaction) => t.objectiveId === null && SHARED_CATEGORIES.includes(t.category);
  return {
    count: txs.length,
    total: txs.reduce((sum, t) => sum + t.amount, 0),
    receipts: txs.filter((t) => !SHARED_CATEGORIES.includes(t.category)).length,
    itemized: txs.filter((t) => (t.lineItems?.length ?? 0) > 0).length,
    mapped: txs.filter((t) => t.objectiveId !== null).length,
    shared: txs.filter(shared).length,
    needsReview: txs.filter((t) => t.objectiveId === null && !shared(t)).length,
    equipmentFlagged: txs.reduce(
      (n, t) => n + (t.category === "Equipment" ? (t.lineItems ?? []).filter((li) => li.amount >= EQUIPMENT_THRESHOLD).length : 0),
      0,
    ),
    vendors: new Set(txs.map((t) => t.merchant)).size,
  };
}

/** One row of the staged sync animation. */
export interface RampSyncStep {
  id: string;
  label: string;
  /** Count the row ticks up to. */
  target: number;
  /** Noun shown after the count. */
  unit: string;
}

/**
 * The seven staged sync steps, with counts derived from the summary.
 * @param s summary from summarizeRampSync
 * @returns steps in display order; ids are unique and stable
 * Edge cases: the transactions, award and cards rows use workspace-level constants, every other count is from the data.
 */
export function rampSyncSteps(s: RampSyncSummary): RampSyncStep[] {
  return [
    { id: "txns", label: "Fetching transactions", target: RAMP_WORKSPACE_TRANSACTIONS, unit: "scanned" },
    { id: "receipts", label: "Downloading receipts", target: s.receipts, unit: "receipts" },
    { id: "award", label: "Finding award agreement and proposal", target: RAMP_AWARD_DOCUMENTS, unit: "files" },
    { id: "cards", label: "Reading cards and spend programs", target: RAMP_CARDS_READ, unit: "cards" },
    { id: "bills", label: "Pulling bills and vendor records", target: s.vendors, unit: "vendors" },
    { id: "budget", label: "Matching spend to award budget lines", target: s.count, unit: "coded to this award" },
    { id: "objectives", label: "Classifying spend to technical objectives", target: s.mapped, unit: "mapped" },
  ];
}

/** Where the sync animation is at a point in time. */
export interface SyncProgress {
  /** Index of the running step; equals the step count when done. */
  activeStep: number;
  /** 0 to 1 progress within the active step; 1 when done. */
  fraction: number;
  done: boolean;
}

/**
 * Position of the sync animation after `elapsedMs`.
 * @param elapsedMs time since the sync started; negative values count as zero
 * @param stepCount number of steps
 * @param stepMs duration of each step
 * @returns active step, fraction within it, and whether the sync is finished
 * Edge cases: a zero step count or non-positive step duration is reported as done.
 */
export function syncProgress(elapsedMs: number, stepCount: number, stepMs: number): SyncProgress {
  if (stepCount <= 0 || stepMs <= 0) return { activeStep: Math.max(0, stepCount), fraction: 1, done: true };
  const t = Math.max(0, elapsedMs);
  if (t >= stepCount * stepMs) return { activeStep: stepCount, fraction: 1, done: true };
  const activeStep = Math.floor(t / stepMs);
  return { activeStep, fraction: (t - activeStep * stepMs) / stepMs, done: false };
}

/**
 * Count shown while a row ticks up.
 * @param target final count
 * @param fraction progress 0 to 1; clamped, NaN counts as 0
 * @returns rounded count between 0 and target
 */
export function tickCount(target: number, fraction: number): number {
  const f = Number.isNaN(fraction) ? 0 : Math.max(0, Math.min(1, fraction));
  return Math.round(target * f);
}

/**
 * The Ramp custom field value spend is coded with, e.g. "Grant: NSF SBIR SAMPLE-2614-0418".
 * @param a the parsed award
 * @returns label shown in the consent scopes
 */
export function grantFieldLabel(a: Award): string {
  return `Grant: NSF SBIR ${a.awardNumber}`;
}

/** One entry in the report's "Sources used" strip. */
export interface SourceUsed {
  source: Source;
  label: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Compact per-source counts for the report.
 * @param s Ramp sync summary
 * @param ev work evidence from GitHub, Linear and Google Docs
 * @param rampConnected whether the Ramp sync has run
 * @returns rows for Ramp, GitHub, Linear and Docs, in that order
 * Edge cases: Ramp reads "not connected" when the sync has not run; zero counts still show a row.
 */
export function sourcesUsed(s: RampSyncSummary, ev: Evidence[], rampConnected: boolean): SourceUsed[] {
  const count = (src: Evidence["source"]) => ev.filter((e) => e.source === src).length;
  return [
    { source: "ramp", label: rampConnected ? `${plural(s.count, "transaction", "transactions")}, ${formatUSD(s.total)}` : "not connected" },
    { source: "github", label: plural(count("github"), "commit or PR", "commits and PRs") },
    { source: "linear", label: plural(count("linear"), "issue", "issues") },
    { source: "docs", label: plural(count("docs"), "doc", "docs") },
  ];
}
