import { describe, expect, it } from "vitest";
import { award, DEMO_TODAY, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions } from "@/data/transactions";
import { resolveCitation } from "@/lib/citations";
import { applyResolutions } from "@/lib/flags";
import { initialEvidenceState } from "@/lib/metrics";
import { buildReport, countGaps, phaseTwoHeadStart, toMarkdown, type ReportInput } from "@/lib/report";
import type { FlagStatus } from "@/lib/types";

const OPEN: Record<string, FlagStatus> = {
  "equipment-t7": "open", "unallowable-t12": "open", "invention-e7": "open", "atrisk-o3": "open", "milestone-m2": "open",
};
const input = (flagStatus: Record<string, FlagStatus>): ReportInput => ({
  award, objectives, evidence, evidenceState: initialEvidenceState(evidence),
  transactions: applyResolutions(transactions, flagStatus), flagStatus, today: DEMO_TODAY,
});
const ctx = { award, evidence, transactions };

describe("buildReport", () => {
  it("every citation resolves to a real record", () => {
    for (const s of buildReport(input(OPEN))) for (const c of s.claims) {
      expect(c.citations.length).toBeGreaterThan(0);
      for (const id of c.citations) expect(resolveCitation(id, ctx), id).not.toBeNull();
    }
  });
  it("shows gaps for open items instead of writing claims", () => {
    const sections = buildReport(input(OPEN));
    expect(countGaps(sections)).toBe(6);
    expect(sections.find((s) => s.id === "inventions")!.claims).toEqual([]);
    expect(sections.find((s) => s.id === "problems")!.claims).toEqual([]);
  });
  it("turns resolved flags into cited claims", () => {
    const all = Object.fromEntries(Object.keys(OPEN).map((k) => [k, "resolved" as FlagStatus]));
    const sections = buildReport(input(all));
    expect(countGaps(sections)).toBe(2); // O2 and O3 open gaps remain
    expect(sections.find((s) => s.id === "equipment")!.claims[0].text).toMatch(/recorded in the equipment inventory/);
    expect(sections.find((s) => s.id === "problems")!.claims.map((c) => c.citations[0])).toEqual(["e9", "t12"]);
    expect(sections.find((s) => s.id === "summary")!.claims[1].text).toMatch(/\$151,288/);
  });
  it("says no inventions only when none were flagged", () => {
    const sections = buildReport(input({}));
    expect(sections.find((s) => s.id === "inventions")!.claims[0].text).toMatch(/No subject inventions/);
  });
  it("excludes unmapped evidence and flags an objective with no work", () => {
    const state = initialEvidenceState(evidence);
    for (const id of ["e6", "e9", "e13"]) state[id] = { objectiveId: null, confirmed: true };
    const sections = buildReport({ ...input(OPEN), evidenceState: state });
    const o3 = sections.find((s) => s.id === "obj-o3")!;
    expect(o3.claims).toHaveLength(1);
    expect(o3.gaps[0].text).toMatch(/No work is linked to O3/);
    expect(sections.flatMap((s) => s.claims).some((c) => c.citations.includes("e12"))).toBe(false);
  });
});

describe("phaseTwoHeadStart and toMarkdown", () => {
  it("reuses measured objective claims", () => {
    const claims = phaseTwoHeadStart(buildReport(input(OPEN)));
    expect(claims.some((c) => c.citations[0] === "e4")).toBe(true);
    expect(claims.every((c) => /\d/.test(c.text))).toBe(true);
  });
  it("numbers citations once and lists gaps and unresolved sources", () => {
    const md = toMarkdown("T", [{ id: "s", heading: "H", claims: [{ text: "A.", citations: ["x", "y"] }, { text: "B.", citations: ["x"] }], gaps: [{ id: "g", text: "Missing." }] }], (id) => (id === "x" ? "Source X" : null));
    expect(md).toContain("- A. [1][2]");
    expect(md).toContain("- B. [1]");
    expect(md).toContain("- **GAP:** Missing.");
    expect(md).toContain("1. Source X");
    expect(md).toContain("2. UNRESOLVED CITATION (y)");
  });
});

describe("resolveCitation", () => {
  it("handles every id form and returns null for unknown ids", () => {
    expect(resolveCitation("ledger", ctx)!.detail).toMatch(/14 transactions/);
    expect(resolveCitation("award:p. 6, Sec. 2.1", ctx)!.label).toBe("Award, p. 6, Sec. 2.1");
    expect(resolveCitation("e4", ctx)!.source).toBe("docs");
    expect(resolveCitation("t7", ctx)!.label).toBe("Lambda $14,200");
    expect(resolveCitation("nope", ctx)).toBeNull();
  });
});
