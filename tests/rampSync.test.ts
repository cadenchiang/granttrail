import { describe, expect, it } from "vitest";
import { award } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions } from "@/data/transactions";
import {
  RAMP_CARDS_READ, RAMP_SYNC_STEP_MS, RAMP_WORKSPACE_TRANSACTIONS, grantFieldLabel,
  RAMP_AWARD_DOCUMENTS, rampSyncSteps, sourcesUsed, summarizeRampSync, syncProgress, tickCount,
} from "@/lib/rampSync";
import type { Transaction } from "@/lib/types";

describe("summarizeRampSync", () => {
  const s = summarizeRampSync(transactions);
  it("matches the sample transactions", () => {
    expect(s.count).toBe(14);
    expect(s.total).toBe(151502);
    expect(s.receipts).toBe(10);
    expect(s.itemized).toBe(2);
    expect(s.mapped).toBe(9);
    expect(s.shared).toBe(4);
    expect(s.needsReview).toBe(1);
    expect(s.equipmentFlagged).toBe(1);
    expect(s.vendors).toBe(8);
  });
  it("mapped + shared + needsReview covers every transaction", () => {
    expect(s.mapped + s.shared + s.needsReview).toBe(s.count);
  });
  it("handles an empty list", () => {
    expect(summarizeRampSync([])).toEqual({
      count: 0, total: 0, receipts: 0, itemized: 0, mapped: 0, shared: 0, needsReview: 0, equipmentFlagged: 0, vendors: 0,
    });
  });
  it("does not flag equipment under the threshold", () => {
    const small: Transaction[] = [{ ...transactions[6], lineItems: [{ description: "GPU", amount: 9999 }] }];
    expect(summarizeRampSync(small).equipmentFlagged).toBe(0);
  });
});

describe("rampSyncSteps", () => {
  it("has seven steps whose counts come from the summary", () => {
    const s = summarizeRampSync(transactions);
    const steps = rampSyncSteps(s);
    expect(steps).toHaveLength(7);
    expect(steps[0]).toMatchObject({ label: "Fetching transactions", target: RAMP_WORKSPACE_TRANSACTIONS });
    expect(steps[1].target).toBe(s.receipts);
    expect(steps[2]).toMatchObject({ id: "award", label: "Finding award agreement and proposal", target: RAMP_AWARD_DOCUMENTS });
    expect(steps[3].target).toBe(RAMP_CARDS_READ);
    expect(steps[5].target).toBe(14);
    expect(steps[6].target).toBe(s.mapped);
    expect(new Set(steps.map((x) => x.id)).size).toBe(7);
  });
  it("total animation lasts 4 to 6 seconds", () => {
    const ms = rampSyncSteps(summarizeRampSync(transactions)).length * RAMP_SYNC_STEP_MS;
    expect(ms).toBeGreaterThanOrEqual(4000);
    expect(ms).toBeLessThanOrEqual(6000);
  });
});

describe("syncProgress", () => {
  it("starts at step 0 with no progress", () => {
    expect(syncProgress(0, 6, 800)).toEqual({ activeStep: 0, fraction: 0, done: false });
  });
  it("tracks the active step and fraction", () => {
    expect(syncProgress(1200, 6, 800)).toEqual({ activeStep: 1, fraction: 0.5, done: false });
  });
  it("is done at or after the end", () => {
    expect(syncProgress(4800, 6, 800)).toEqual({ activeStep: 6, fraction: 1, done: true });
    expect(syncProgress(99999, 6, 800).done).toBe(true);
  });
  it("treats negative time as zero and bad inputs as done", () => {
    expect(syncProgress(-50, 6, 800).activeStep).toBe(0);
    expect(syncProgress(10, 0, 800).done).toBe(true);
    expect(syncProgress(10, 6, 0).done).toBe(true);
  });
});

describe("tickCount", () => {
  it("scales and rounds", () => {
    expect(tickCount(14, 0.5)).toBe(7);
    expect(tickCount(1286, 1)).toBe(1286);
  });
  it("clamps the fraction", () => {
    expect(tickCount(14, -1)).toBe(0);
    expect(tickCount(14, 2)).toBe(14);
    expect(tickCount(14, Number.NaN)).toBe(0);
  });
});

describe("grantFieldLabel", () => {
  it("uses the real award number", () => {
    expect(grantFieldLabel(award)).toBe(`Grant: NSF SBIR ${award.awardNumber}`);
  });
});

describe("sourcesUsed", () => {
  it("lists Ramp and the work tools with counts from the data", () => {
    const rows = sourcesUsed(summarizeRampSync(transactions), evidence, true);
    expect(rows.map((r) => r.source)).toEqual(["ramp", "github", "linear", "docs"]);
    expect(rows[0].label).toBe("14 transactions, $151,502");
    expect(rows[1].label).toBe("5 commits and PRs");
    expect(rows[2].label).toBe("4 issues");
    expect(rows[3].label).toBe("5 docs");
  });
  it("says Ramp is not connected when it is not", () => {
    expect(sourcesUsed(summarizeRampSync(transactions), evidence, false)[0].label).toBe("not connected");
  });
  it("uses singular nouns for one item", () => {
    const one = summarizeRampSync([transactions[1]]);
    const rows = sourcesUsed(one, [evidence.find((e) => e.source === "linear")!], true);
    expect(rows[0].label).toBe("1 transaction, $6,400");
    expect(rows[2].label).toBe("1 issue");
    expect(rows[1].label).toBe("0 commits and PRs");
  });
});
