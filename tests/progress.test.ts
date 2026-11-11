import { describe, expect, it } from "vitest";
import { DEMO_TODAY, milestones, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { initialEvidenceState } from "@/lib/metrics";
import { deriveObjectives, diffProgress, objectiveStatus } from "@/lib/progress";

const derive = (state = initialEvidenceState(evidence)) => deriveObjectives(objectives, evidence, state, milestones, DEMO_TODAY);
const byCode = (code: string, state?: ReturnType<typeof initialEvidenceState>) => derive(state).find((o) => o.code === code)!;

describe("deriveObjectives", () => {
  it("computes progress and status from the sample evidence", () => {
    expect(derive().map((o) => [o.code, o.progress, o.status])).toEqual([
      ["O1", 100, "complete"],
      ["O2", 65, "in_progress"],
      ["O3", 15, "at_risk"],
    ]);
  });
  it("records which item completed each step", () => {
    expect(byCode("O1").steps.map((s) => s.doneBy)).toEqual(["e1", "e2", "e3", "e4"]);
    expect(byCode("O2").steps.find((s) => s.id === "o2-target")!.doneBy).toBeNull();
  });
  it("moves O3 when a person maps the bench-throughput PR to it", () => {
    const state = initialEvidenceState(evidence);
    expect(byCode("O3", state).progress).toBe(15);
    state.e14 = { objectiveId: "o3", confirmed: true };
    const o3 = byCode("O3", state);
    expect(o3.progress).toBe(40);
    expect(o3.status).toBe("at_risk"); // still under half done with the milestone 54 days out
  });
  it("ignores low-confidence work until someone confirms it", () => {
    const state = initialEvidenceState(evidence);
    state.e14 = { objectiveId: "o3", confirmed: false };
    expect(byCode("O3", state).progress).toBe(15);
  });
  it("only counts a step for the objective that owns it", () => {
    const state = initialEvidenceState(evidence);
    state.e14 = { objectiveId: "o2", confirmed: true };
    expect(byCode("O2", state).progress).toBe(65);
    expect(byCode("O3", state).progress).toBe(15);
  });
  it("drops progress when work is marked as not grant work", () => {
    const state = initialEvidenceState(evidence);
    state.e4 = { objectiveId: null, confirmed: true };
    const o1 = byCode("O1", state);
    expect(o1.progress).toBe(65);
    expect(o1.status).toBe("in_progress");
  });
});

describe("objectiveStatus", () => {
  const m = (due: string) => ({ id: "m", title: "M", due, objectiveId: "o", done: false, sourceRef: "" });
  it("is at risk only when the milestone is close and less than half is done", () => {
    expect(objectiveStatus(40, m("2026-11-30"), DEMO_TODAY)).toBe("at_risk");
    expect(objectiveStatus(60, m("2026-11-30"), DEMO_TODAY)).toBe("in_progress");
    expect(objectiveStatus(10, m("2027-06-30"), DEMO_TODAY)).toBe("in_progress");
  });
  it("treats an overdue milestone as at risk and 100% as complete", () => {
    expect(objectiveStatus(90, m("2026-10-01"), DEMO_TODAY)).toBe("at_risk");
    expect(objectiveStatus(100, m("2026-10-01"), DEMO_TODAY)).toBe("complete");
    expect(objectiveStatus(30, undefined, DEMO_TODAY)).toBe("in_progress");
  });
});

describe("diffProgress", () => {
  it("reports the change and the steps that flipped", () => {
    const state = initialEvidenceState(evidence);
    const before = derive(state);
    state.e14 = { objectiveId: "o3", confirmed: true };
    expect(diffProgress(before, derive(state))).toEqual([{
      code: "O3", from: 15, to: 40, statusFrom: "at_risk", statusTo: "at_risk",
      stepsGained: ["Bench throughput reaches 30 cells/min"], stepsLost: [],
    }]);
  });
  it("is empty when nothing moved", () => {
    expect(diffProgress(derive(), derive())).toEqual([]);
  });
});
