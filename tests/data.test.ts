import { describe, expect, it } from "vitest";
import { award, milestones, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions } from "@/data/transactions";

describe("sample data integrity", () => {
  const ids = new Set(objectives.map((o) => o.id));
  it("approved budget lines sum to the award amount", () => {
    expect(award.budget.reduce((s, b) => s + b.approved, 0)).toBe(award.amount);
  });
  it("every reference points at a real objective", () => {
    for (const e of evidence) if (e.suggestedObjectiveId) expect(ids.has(e.suggestedObjectiveId)).toBe(true);
    for (const t of transactions) if (t.objectiveId) expect(ids.has(t.objectiveId)).toBe(true);
    for (const m of milestones) if (m.objectiveId) expect(ids.has(m.objectiveId)).toBe(true);
  });
  it("ids are unique and line items add up to the transaction", () => {
    expect(new Set(evidence.map((e) => e.id)).size).toBe(evidence.length);
    expect(new Set(transactions.map((t) => t.id)).size).toBe(transactions.length);
    for (const t of transactions) if (t.lineItems) expect(t.lineItems.reduce((s, l) => s + l.amount, 0)).toBe(t.amount);
  });
  it("final report deadline is 120 days after the award ends", () => {
    const due = milestones.find((m) => m.id === "m5")!.due;
    expect((Date.parse(due) - Date.parse(award.end)) / 86_400_000).toBe(120);
  });
});
