/**
 * Objective progress derived from evidence. Each objective's work-plan steps are
 * done when a reportable evidence item mapped to that objective completes them, so
 * confirming or remapping work moves the numbers instead of a hand-set percentage.
 */
import { daysBetween } from "./format";
import { isReportable } from "./metrics";
import type { Evidence, EvidenceState, LiveObjective, Milestone, Objective, ObjectiveStatus } from "./types";

/** An objective is at risk when its next milestone is this close... */
export const AT_RISK_WINDOW_DAYS = 60;
/** ...and less than this share of its work is done. */
export const AT_RISK_BELOW = 50;

/**
 * Status from progress and the objective's next unmet milestone.
 * Overdue milestones make an unfinished objective at risk regardless of progress.
 */
export function objectiveStatus(progress: number, next: Milestone | undefined, today: string): ObjectiveStatus {
  if (progress >= 100) return "complete";
  if (!next) return "in_progress";
  const days = daysBetween(today, next.due);
  if (days < 0) return "at_risk";
  return days <= AT_RISK_WINDOW_DAYS && progress < AT_RISK_BELOW ? "at_risk" : "in_progress";
}

/**
 * Derive one objective's steps, progress and status.
 * A step counts only when the completing item is mapped to this objective and reportable
 * (confirmed by a person, or mapped by the AI with high confidence).
 */
export function deriveObjective(
  o: Objective,
  evidence: Evidence[],
  state: Record<string, EvidenceState>,
  milestones: Milestone[],
  today: string,
): LiveObjective {
  const steps = o.steps.map((step) => {
    const done = evidence
      .filter((e) => e.completesStep === step.id && state[e.id]?.objectiveId === o.id && isReportable(e, state))
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    return { ...step, doneBy: done?.id ?? null };
  });
  const total = steps.reduce((s, x) => s + x.weight, 0);
  const earned = steps.reduce((s, x) => s + (x.doneBy ? x.weight : 0), 0);
  const progress = total > 0 ? Math.round((earned / total) * 100) : 0;
  const next = milestones.find((m) => m.objectiveId === o.id && !m.done);
  return { ...o, steps, progress, status: objectiveStatus(progress, next, today) };
}

/** Derive every objective in award order. */
export function deriveObjectives(
  objectives: Objective[],
  evidence: Evidence[],
  state: Record<string, EvidenceState>,
  milestones: Milestone[],
  today: string,
): LiveObjective[] {
  return objectives.map((o) => deriveObjective(o, evidence, state, milestones, today));
}

/** What changed for one objective after a mapping change; used for the in-app notice. */
export interface ProgressChange {
  code: string;
  from: number;
  to: number;
  statusFrom: ObjectiveStatus;
  statusTo: ObjectiveStatus;
  /** Labels of steps that flipped done or undone. */
  stepsGained: string[];
  stepsLost: string[];
}

/** Objectives whose progress or status differs between two derivations. */
export function diffProgress(before: LiveObjective[], after: LiveObjective[]): ProgressChange[] {
  return after.flatMap((a) => {
    const b = before.find((x) => x.id === a.id);
    if (!b || (b.progress === a.progress && b.status === a.status)) return [];
    const was = new Set(b.steps.filter((s) => s.doneBy).map((s) => s.id));
    const now = new Set(a.steps.filter((s) => s.doneBy).map((s) => s.id));
    return [{
      code: a.code, from: b.progress, to: a.progress, statusFrom: b.status, statusTo: a.status,
      stepsGained: a.steps.filter((s) => now.has(s.id) && !was.has(s.id)).map((s) => s.label),
      stepsLost: b.steps.filter((s) => was.has(s.id) && !now.has(s.id)).map((s) => s.label),
    }];
  });
}
