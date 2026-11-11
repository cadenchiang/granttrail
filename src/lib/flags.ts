/**
 * Detects reportable items teams tend to miss: equipment, possible inventions,
 * unallowable costs, and objectives or milestones that are slipping.
 */
import { daysBetween, formatDate, formatUSD } from "./format";
import type { Evidence, EvidenceState, Flag, FlagStatus, LiveObjective, Milestone, Transaction } from "./types";

/** 2 CFR 200.1 per-unit equipment threshold (raised to $10,000 in the 2024 revision). */
export const EQUIPMENT_THRESHOLD = 10_000;
/** Milestones due within this many days are flagged if not yet met. */
export const MILESTONE_WARNING_DAYS = 14;

const ALCOHOL = /\b(wine|beer|cocktails?|alcohol|liquor|spirits)\b/i;
const NOVELTY = /\b(novel|not seen in prior work|new (method|technique|augmentation|algorithm))\b/i;

export interface FlagInput {
  /** Objectives with status and progress derived from evidence (see progress.ts). */
  objectives: LiveObjective[];
  milestones: Milestone[];
  evidence: Evidence[];
  evidenceState: Record<string, EvidenceState>;
  transactions: Transaction[];
  today: string;
  /** Number of items in the review queue. */
  reviewCount: number;
}

/**
 * Run every check and return flags in priority order. Flag ids are stable so
 * user decisions (resolved/open) survive re-detection.
 */
export function detectFlags(input: FlagInput): Flag[] {
  const flags: Flag[] = [];

  for (const t of input.transactions) {
    for (const li of t.lineItems ?? []) {
      if (t.category === "Equipment" && li.amount >= EQUIPMENT_THRESHOLD) {
        flags.push({
          id: `equipment-${t.id}`, kind: "equipment",
          title: `Equipment purchase: ${li.description} (${formatUSD(li.amount)})`,
          detail: `Bought from ${t.merchant} on ${formatDate(t.date)} with grant funds. It must be listed in the report and tracked in your equipment inventory.`,
          rule: "2 CFR 200.1 and 200.313: items of $10,000 or more per unit are equipment and must be recorded and reported.",
          actionLabel: "Add to equipment inventory", resolvedLabel: "Added to inventory", refs: [t.id],
        });
      }
      if (ALCOHOL.test(li.description)) {
        flags.push({
          id: `unallowable-${t.id}`, kind: "unallowable",
          title: `Unallowable cost: ${li.description} (${formatUSD(li.amount)})`,
          detail: `Part of "${t.memo}" at ${t.merchant} is alcohol and is coded to the grant.`,
          rule: "2 CFR 200.423: costs of alcoholic beverages are unallowable on federal awards.",
          actionLabel: `Move ${formatUSD(li.amount)} off the grant`, resolvedLabel: "Moved off the grant", refs: [t.id],
        });
      }
    }
  }

  for (const e of input.evidence) {
    if (NOVELTY.test(e.excerpt) || NOVELTY.test(e.title)) {
      flags.push({
        id: `invention-${e.id}`, kind: "invention",
        title: `Possible invention: ${e.title.replace(/^Method note:\s*/i, "")}`,
        detail: `"${e.excerpt}" (${e.author}, ${formatDate(e.date)}). This language suggests something new was made under the award. Whether it is a subject invention is a legal call, so send it to counsel before the report says anything about inventions.`,
        rule: "37 CFR 401.14 (Bayh-Dole): if counsel confirms a subject invention, disclose it to the agency (usually via iEdison) within 2 months of the inventor's written disclosure to the company.",
        actionLabel: "Send to counsel for review", resolvedLabel: "Sent to counsel", refs: [e.id],
      });
    }
  }

  for (const o of input.objectives) {
    if (o.status !== "at_risk") continue;
    const refs = input.evidence.filter((e) => input.evidenceState[e.id]?.objectiveId === o.id).map((e) => e.id);
    flags.push({
      id: `atrisk-${o.id}`, kind: "progress",
      title: `${o.code} is behind: ${o.progress}% done`,
      detail: `${o.title}. Reviewers will expect the report to explain the delay and the revised plan.`,
      rule: "Progress reports must describe problems, delays and changes in approach.",
      actionLabel: "Explain in report", resolvedLabel: "Explained in report", refs,
    });
  }

  for (const m of input.milestones) {
    const daysLeft = daysBetween(input.today, m.due);
    if (m.done || !m.objectiveId || daysLeft < 0 || daysLeft > MILESTONE_WARNING_DAYS) continue;
    flags.push({
      id: `milestone-${m.id}`, kind: "progress",
      title: `Milestone due in ${daysLeft} days: ${m.title}`,
      detail: `Due ${formatDate(m.due)} (${m.sourceRef}). Linked evidence does not show it met yet.`,
      rule: "Missed milestones should be reported with a reason and new date.",
      actionLabel: "Remind owner", resolvedLabel: "Owner reminded", refs: [],
    });
  }

  if (input.reviewCount > 0) {
    flags.push({
      id: "review", kind: "review",
      title: `${input.reviewCount} work item${input.reviewCount === 1 ? " needs" : "s need"} a human check`,
      detail: "GrantTrail was not confident which objective these belong to. They stay out of the report until someone confirms them.",
      rule: "Nothing goes into a report without a person confirming it.",
      actionLabel: "Review items", resolvedLabel: "Reviewed", refs: [],
    });
  }

  return flags;
}

/**
 * Remove alcohol line items from transactions whose unallowable flag is resolved,
 * so spend totals reflect the cost being moved off the grant.
 */
export function applyResolutions(txns: Transaction[], status: Record<string, FlagStatus>): Transaction[] {
  return txns.map((t) => {
    if (status[`unallowable-${t.id}`] !== "resolved" || !t.lineItems) return t;
    const kept = t.lineItems.filter((li) => !ALCOHOL.test(li.description));
    return { ...t, lineItems: kept, amount: kept.reduce((s, li) => s + li.amount, 0) };
  });
}
