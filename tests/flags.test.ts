import { describe, expect, it } from "vitest";
import { DEMO_TODAY, milestones, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions } from "@/data/transactions";
import { applyResolutions, detectFlags, type FlagInput } from "@/lib/flags";
import { initialEvidenceState, totalSpent } from "@/lib/metrics";

const base: FlagInput = {
  objectives, milestones, evidence, evidenceState: initialEvidenceState(evidence), transactions, today: DEMO_TODAY, reviewCount: 3,
};

describe("detectFlags", () => {
  it("finds every reportable item in the sample", () => {
    expect(detectFlags(base).map((f) => f.id)).toEqual([
      "equipment-t7", "unallowable-t12", "invention-e7", "atrisk-o3", "milestone-m2", "review",
    ]);
  });
  it("respects the $10,000 equipment threshold", () => {
    const under = transactions.map((t) => (t.id === "t7" ? { ...t, lineItems: [{ description: "GPU", amount: 9999 }] } : t));
    expect(detectFlags({ ...base, transactions: under }).some((f) => f.kind === "equipment")).toBe(false);
  });
  it("only warns about milestones inside the window and not done", () => {
    const ids = (today: string) => detectFlags({ ...base, today }).filter((f) => f.id.startsWith("milestone")).map((f) => f.id);
    expect(ids("2026-10-01")).toEqual([]);
    expect(ids("2026-11-01")).toEqual([]);
    expect(ids("2026-12-05")).toEqual(["milestone-m3"]);
  });
  it("omits the review flag when the queue is empty and pluralizes correctly", () => {
    expect(detectFlags({ ...base, reviewCount: 0 }).some((f) => f.id === "review")).toBe(false);
    expect(detectFlags({ ...base, reviewCount: 1 }).find((f) => f.id === "review")!.title).toBe("1 work item needs a human check");
  });
});

describe("applyResolutions", () => {
  it("removes alcohol only after the flag is resolved", () => {
    expect(applyResolutions(transactions, {})).toEqual(transactions);
    const fixed = applyResolutions(transactions, { "unallowable-t12": "resolved" });
    expect(fixed.find((t) => t.id === "t12")!.amount).toBe(398);
    expect(totalSpent(fixed)).toBe(151502 - 214);
  });
});
