/**
 * Builds the progress report draft. Every claim cites a record; when a record
 * is missing the section gets a gap instead of invented text.
 */
import { EQUIPMENT_THRESHOLD } from "./flags";
import { formatPct, formatUSD } from "./format";
import { budgetUsed, evidenceFor, spendByCategory, timeElapsed, totalSpent } from "./metrics";
import type { Award, Claim, Evidence, EvidenceState, FlagStatus, Gap, Objective, ReportSection, Transaction } from "./types";

export interface ReportInput {
  award: Award;
  objectives: Objective[];
  evidence: Evidence[];
  evidenceState: Record<string, EvidenceState>;
  /** Transactions after flag resolutions are applied. */
  transactions: Transaction[];
  /** Status of every detected flag id (callers default undecided flags to "open"). */
  flagStatus: Record<string, FlagStatus>;
  today: string;
}

const STATUS_WORDS: Record<Objective["status"], string> = {
  complete: "complete",
  in_progress: "in progress",
  at_risk: "behind schedule",
};

/** True when a flag exists in the status map and is resolved. */
function resolved(status: Record<string, FlagStatus>, id: string): boolean {
  return status[id] === "resolved";
}

/** One section per objective: status line, dated evidence claims, open gap. */
function objectiveSection(o: Objective, input: ReportInput): ReportSection {
  const items = evidenceFor(o.id, input.evidence, input.evidenceState).reverse();
  const claims: Claim[] = [
    { text: `Target: ${o.target}. Status: ${STATUS_WORDS[o.status]} (${o.progress}%).`, citations: [`award:${o.sourceRef}`] },
    ...items.map((e) => ({ text: e.claim, citations: [e.id] })),
  ];
  const gaps: Gap[] = [];
  if (items.length === 0) gaps.push({ id: `gap-${o.id}-none`, text: `No work is linked to ${o.code} yet. Link commits, tickets or docs before reporting on it.` });
  if (o.status !== "complete" && o.openGap) gaps.push({ id: `gap-${o.id}`, text: o.openGap });
  return { id: `obj-${o.id}`, heading: `${o.code}. ${o.title}`, claims, gaps };
}

/**
 * Assemble the full draft in report order.
 * @returns sections; sections with no claims still appear so gaps are visible
 */
export function buildReport(input: ReportInput): ReportSection[] {
  const { award, objectives, transactions: txns, flagStatus } = input;
  const time = timeElapsed(award, input.today);
  const done = objectives.filter((o) => o.status === "complete");

  const summary: ReportSection = {
    id: "summary",
    heading: "Summary of progress",
    claims: [
      {
        text: `${award.company} completed ${done.length} of ${objectives.length} technical objectives by day ${time.day} of the ${time.totalDays}-day award period.`,
        citations: [...objectives.map((o) => `award:${o.sourceRef}`)],
      },
      {
        text: `${formatUSD(totalSpent(txns))} of the ${formatUSD(award.amount)} award (${formatPct(budgetUsed(award, txns))}) has been spent.`,
        citations: ["ledger"],
      },
    ],
    gaps: [],
  };

  const budget: ReportSection = {
    id: "budget",
    heading: "Budget and spending",
    claims: spendByCategory(award, txns)
      .filter((c) => c.spent > 0)
      .map((c) => ({
        text: `${c.category}: ${formatUSD(c.spent)} of ${formatUSD(c.approved)} approved${c.approved > 0 ? ` (${formatPct(c.ratio)})` : ", no approved budget line"}.`,
        citations: txns.filter((t) => t.category === c.category).map((t) => t.id),
      })),
    gaps: [],
  };

  const equipment: ReportSection = { id: "equipment", heading: "Equipment", claims: [], gaps: [] };
  for (const t of txns.filter((x) => x.category === "Equipment" && (x.lineItems ?? []).some((li) => li.amount >= EQUIPMENT_THRESHOLD))) {
    const inInventory = resolved(flagStatus, `equipment-${t.id}`);
    equipment.claims.push({
      text: `${t.lineItems![0].description} purchased from ${t.merchant} for ${formatUSD(t.amount)} with grant funds${inInventory ? " and recorded in the equipment inventory" : ""}.`,
      citations: [t.id],
    });
    if (!inInventory) equipment.gaps.push({ id: `gap-equipment-${t.id}`, text: `Confirm the ${t.lineItems![0].description.toLowerCase()} is recorded in the equipment inventory.` });
  }

  const inventions: ReportSection = { id: "inventions", heading: "Inventions and disclosures", claims: [], gaps: [] };
  const inventionIds = Object.keys(flagStatus).filter((k) => k.startsWith("invention-"));
  for (const flagId of inventionIds) {
    const e = input.evidence.find((x) => x.id === flagId.slice("invention-".length));
    if (!e) continue;
    if (resolved(flagStatus, flagId)) {
      inventions.claims.push({ text: `A possible subject invention was identified (${e.title.replace(/^Method note:\s*/i, "")}) and an iEdison disclosure has been started.`, citations: [e.id] });
    } else {
      inventions.gaps.push({ id: `gap-${flagId}`, text: `Possible invention found (${e.title.replace(/^Method note:\s*/i, "")}). Decide whether to disclose it before the report says anything about inventions.` });
    }
  }
  if (inventionIds.length === 0) inventions.claims.push({ text: "No subject inventions were identified during this period.", citations: ["ledger"] });

  const problems: ReportSection = { id: "problems", heading: "Problems and changes", claims: [], gaps: [] };
  for (const o of objectives.filter((x) => x.status === "at_risk")) {
    const blocker = evidenceFor(o.id, input.evidence, input.evidenceState).find((e) => /^blocked/i.test(e.excerpt));
    if (resolved(flagStatus, `atrisk-${o.id}`) && blocker) {
      problems.claims.push({ text: `${o.code} is behind schedule (${o.progress}% complete). ${blocker.claim}`, citations: [blocker.id] });
    } else {
      problems.gaps.push({ id: `gap-problem-${o.id}`, text: `Explain why ${o.code} is behind schedule and give the revised plan.` });
    }
  }
  for (const t of input.transactions) {
    const id = `unallowable-${t.id}`;
    if (!(id in flagStatus)) continue;
    if (resolved(flagStatus, id)) problems.claims.push({ text: `An unallowable alcohol charge on "${t.memo}" was moved off the grant.`, citations: [t.id] });
    else problems.gaps.push({ id: `gap-${id}`, text: `An alcohol charge on "${t.memo}" is still coded to the grant. Move it off before reporting spend.` });
  }

  return [summary, ...objectives.map((o) => objectiveSection(o, input)), budget, equipment, inventions, problems];
}

/** Count open gaps across all sections. */
export function countGaps(sections: ReportSection[]): number {
  return sections.reduce((n, s) => n + s.gaps.length, 0);
}

/**
 * Claims worth reusing as preliminary data in a Phase II proposal:
 * objective claims that contain a measured number.
 */
export function phaseTwoHeadStart(sections: ReportSection[]): Claim[] {
  return sections
    .filter((s) => s.id.startsWith("obj-"))
    .flatMap((s) => s.claims.slice(1))
    .filter((c) => /\d/.test(c.text));
}

/**
 * Render the draft as Markdown with numbered citations and a sources list.
 * @param label resolves a citation id to a display string; unknown ids are kept and marked
 */
export function toMarkdown(title: string, sections: ReportSection[], label: (id: string) => string | null): string {
  const order: string[] = [];
  const num = (id: string) => {
    if (!order.includes(id)) order.push(id);
    return order.indexOf(id) + 1;
  };
  const lines = [`# ${title}`, ""];
  for (const s of sections) {
    lines.push(`## ${s.heading}`, "");
    for (const c of s.claims) lines.push(`- ${c.text} ${c.citations.map((id) => `[${num(id)}]`).join("")}`.trimEnd());
    for (const g of s.gaps) lines.push(`- **GAP:** ${g.text}`);
    lines.push("");
  }
  lines.push("## Sources", "");
  order.forEach((id, i) => lines.push(`${i + 1}. ${label(id) ?? `UNRESOLVED CITATION (${id})`}`));
  return lines.join("\n") + "\n";
}
