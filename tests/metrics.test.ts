import { describe, expect, it } from "vitest";
import { award, DEMO_TODAY, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions } from "@/data/transactions";
import {
  budgetUsed, evidenceFor, initialEvidenceState, objectiveSummaries, reviewQueue, spendByCategory, timeElapsed, totalSpent,
} from "@/lib/metrics";

describe("metrics", () => {
  it("sample spend is 55% of the award", () => {
    expect(totalSpent(transactions)).toBe(151502);
    expect(Math.round(budgetUsed(award, transactions) * 100)).toBe(55);
    expect(totalSpent([])).toBe(0);
    expect(budgetUsed({ ...award, amount: 0 }, transactions)).toBe(0);
  });
  it("time elapsed counts inclusive days and clamps", () => {
    expect(timeElapsed(award, DEMO_TODAY)).toMatchObject({ day: 114, totalDays: 184 });
    expect(timeElapsed(award, "2026-01-01").day).toBe(0);
    expect(timeElapsed(award, "2027-06-01").ratio).toBe(1);
  });
  it("spend by category keeps unbudgeted categories visible", () => {
    const rows = spendByCategory(award, transactions);
    expect(rows.find((r) => r.category === "Personnel")).toMatchObject({ approved: 165000, spent: 82500, ratio: 0.5 });
    const noTravel = { ...award, budget: award.budget.filter((b) => b.category !== "Travel") };
    expect(spendByCategory(noTravel, transactions).find((r) => r.category === "Travel")).toMatchObject({ approved: 0, spent: 1240, ratio: Infinity });
  });
  it("review queue holds unmapped and low-confidence items until confirmed", () => {
    const state = initialEvidenceState(evidence);
    expect(reviewQueue(evidence, state).map((e) => e.id)).toEqual(["e12", "e13", "e14"]);
    state.e14 = { objectiveId: "o3", confirmed: true };
    expect(reviewQueue(evidence, state).map((e) => e.id)).toEqual(["e12", "e13"]);
  });
  it("evidence and summaries follow the current mapping", () => {
    const state = initialEvidenceState(evidence);
    expect(evidenceFor("o1", evidence, state).map((e) => e.id)).toEqual(["e4", "e3", "e2", "e1"]);
    const sums = objectiveSummaries(objectives, evidence, state, transactions, DEMO_TODAY);
    expect(sums[0]).toMatchObject({ evidenceCount: 4, spend: 6400 + 9800 + 3900 + 3150, lastActivity: "2026-08-30" });
    expect(sums[2].daysSinceActivity).toBe(3);
    const empty = objectiveSummaries(objectives, [], {}, [], DEMO_TODAY);
    expect(empty[0]).toMatchObject({ evidenceCount: 0, lastActivity: null, daysSinceActivity: null });
  });
});
