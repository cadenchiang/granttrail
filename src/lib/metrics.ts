/**
 * Spending and progress calculations that power the Overview tab.
 */
import { daysBetween } from "./format";
import type { Award, BudgetCategory, Evidence, EvidenceState, Objective, Transaction } from "./types";

/** Evidence below this confidence goes to the human review queue. */
export const REVIEW_CONFIDENCE = 0.7;

/**
 * Sum of all transaction amounts.
 * @param txns transactions coded to the grant
 * @returns dollars (0 for an empty list)
 */
export function totalSpent(txns: Transaction[]): number {
  return txns.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * Share of the award spent so far.
 * @returns ratio 0 to 1+; 0 when the award amount is not positive
 */
export function budgetUsed(award: Award, txns: Transaction[]): number {
  if (award.amount <= 0) return 0;
  return totalSpent(txns) / award.amount;
}

/**
 * How far into the award period `today` is, counting both start and end days.
 * @returns day number, total days, and ratio clamped to 0..1
 */
export function timeElapsed(award: Award, today: string): { day: number; totalDays: number; ratio: number } {
  const totalDays = daysBetween(award.start, award.end) + 1;
  const day = Math.min(Math.max(daysBetween(award.start, today) + 1, 0), totalDays);
  return { day, totalDays, ratio: totalDays > 0 ? day / totalDays : 0 };
}

export interface CategorySpend {
  category: BudgetCategory;
  approved: number;
  spent: number;
  ratio: number;
}

/**
 * Approved budget versus spend for each budget line. Categories with spend but no
 * approved line are still listed with approved = 0 so overspend is never hidden.
 */
export function spendByCategory(award: Award, txns: Transaction[]): CategorySpend[] {
  const rows: CategorySpend[] = award.budget.map((b) => ({ category: b.category, approved: b.approved, spent: 0, ratio: 0 }));
  for (const t of txns) {
    let row = rows.find((r) => r.category === t.category);
    if (!row) {
      row = { category: t.category, approved: 0, spent: 0, ratio: 0 };
      rows.push(row);
    }
    row.spent += t.amount;
  }
  for (const r of rows) r.ratio = r.approved > 0 ? r.spent / r.approved : r.spent > 0 ? Infinity : 0;
  return rows;
}

/**
 * Default evidence state: accept every AI suggestion, nothing confirmed yet.
 */
export function initialEvidenceState(items: Evidence[]): Record<string, EvidenceState> {
  return Object.fromEntries(items.map((e) => [e.id, { objectiveId: e.suggestedObjectiveId, confirmed: false }]));
}

/**
 * Evidence a person still has to check: unconfirmed and either unmapped or low confidence.
 */
export function reviewQueue(items: Evidence[], state: Record<string, EvidenceState>): Evidence[] {
  return items.filter((e) => {
    const s = state[e.id];
    if (!s || s.confirmed) return false;
    return s.objectiveId === null || e.confidence < REVIEW_CONFIDENCE;
  });
}

/**
 * Evidence currently mapped to an objective, newest first.
 */
export function evidenceFor(objectiveId: string, items: Evidence[], state: Record<string, EvidenceState>): Evidence[] {
  return items
    .filter((e) => state[e.id]?.objectiveId === objectiveId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export interface ObjectiveSummary {
  objective: Objective;
  evidenceCount: number;
  spend: number;
  lastActivity: string | null;
  daysSinceActivity: number | null;
}

/**
 * Per-objective rollup of evidence and directly coded spend.
 * Shared spend (objectiveId null) is not split across objectives.
 */
export function objectiveSummaries(
  objectives: Objective[],
  items: Evidence[],
  state: Record<string, EvidenceState>,
  txns: Transaction[],
  today: string,
): ObjectiveSummary[] {
  return objectives.map((o) => {
    const mine = evidenceFor(o.id, items, state);
    const lastActivity = mine[0]?.date ?? null;
    return {
      objective: o,
      evidenceCount: mine.length,
      spend: totalSpent(txns.filter((t) => t.objectiveId === o.id)),
      lastActivity,
      daysSinceActivity: lastActivity ? daysBetween(lastActivity, today) : null,
    };
  });
}
