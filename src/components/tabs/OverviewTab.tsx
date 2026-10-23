/**
 * Spending and progress side by side: the core GrantTrail view.
 */
import { award, DEMO_TODAY, milestones, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { daysBetween, formatDate, formatPct, formatUSD } from "@/lib/format";
import { budgetUsed, objectiveSummaries, spendByCategory, timeElapsed, totalSpent } from "@/lib/metrics";
import type { ObjectiveStatus } from "@/lib/types";
import { Badge, Card, ProgressBar, Stat, type Tone } from "../ui/primitives";
import type { GrantState } from "../useGrantState";

export const STATUS: Record<ObjectiveStatus, { label: string; tone: Tone }> = {
  complete: { label: "Complete", tone: "good" },
  in_progress: { label: "In progress", tone: "info" },
  at_risk: { label: "At risk", tone: "warn" },
};

/** Overview tab. Reads derived state only; no actions besides navigation. */
export function OverviewTab({ s }: { s: GrantState }) {
  const used = budgetUsed(award, s.transactions);
  const time = timeElapsed(award, DEMO_TODAY);
  const done = objectives.filter((o) => o.status === "complete").length;
  const sums = objectiveSummaries(objectives, evidence, s.evidenceState, s.transactions, DEMO_TODAY);
  const behind = objectives.find((o) => o.status === "at_risk");
  const behindMilestone = behind && milestones.find((m) => m.objectiveId === behind.id && !m.done);

  return (
    <div className="space-y-6 rise">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Budget used" value={formatPct(used)} sub={`${formatUSD(totalSpent(s.transactions))} of ${formatUSD(award.amount)}`}>
          <ProgressBar ratio={used} label="Budget used" />
        </Stat>
        <Stat label="Award period" value={formatPct(time.ratio)} sub={`Day ${time.day} of ${time.totalDays}`}>
          <ProgressBar ratio={time.ratio} tone="info" label="Award period elapsed" />
        </Stat>
        <Stat label="Objectives complete" value={`${done} of ${objectives.length}`} sub="From linked evidence">
          <ProgressBar ratio={done / objectives.length} tone="good" label="Objectives complete" />
        </Stat>
        <button onClick={() => s.setTab("flags")} className="h-full text-left">
          <Stat label="Needs attention" value={s.openFlags.length} sub="Open flags. View all" />
        </button>
      </div>

      <Card className="flex gap-3 border-l-4 border-l-accent p-4 text-sm">
        <span className="font-medium">Where you stand:</span>
        <span className="text-muted">
          {formatPct(used)} of the budget is spent at {formatPct(time.ratio)} of the award period, and {done} of {objectives.length} objectives are done.
          {behind && behindMilestone && <> {behind.code} is {behind.progress}% done with {daysBetween(DEMO_TODAY, behindMilestone.due)} days until its milestone.</>}
        </span>
      </Card>

      <section>
        <h2 className="mb-2 text-sm font-semibold">Objectives</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {sums.map(({ objective: o, evidenceCount, spend, lastActivity }) => {
            const next = milestones.find((m) => m.objectiveId === o.id);
            return (
              <Card key={o.id} className="flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-semibold text-muted">{o.code}</div>
                  <Badge tone={STATUS[o.status].tone}>{STATUS[o.status].label}</Badge>
                </div>
                <div className="mt-1 font-medium leading-snug">{o.title}</div>
                <div className="mt-0.5 text-xs text-muted">{o.target}</div>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-muted">Progress</span>
                  <span className="font-medium tabular-nums">{o.progress}%</span>
                </div>
                <div className="mt-1.5"><ProgressBar ratio={o.progress / 100} tone={STATUS[o.status].tone} label={`${o.code} progress`} /></div>
                <dl className="mt-4 grid grid-cols-2 gap-y-1.5 text-xs">
                  <dt className="text-muted">Linked work</dt>
                  <dd className="text-right tabular-nums">
                    <button className="underline decoration-border underline-offset-2 hover:decoration-text" onClick={() => s.setTab("evidence")}>{evidenceCount} items</button>
                  </dd>
                  <dt className="text-muted">Last activity</dt><dd className="text-right">{lastActivity ? formatDate(lastActivity) : "None"}</dd>
                  <dt className="text-muted">Direct spend</dt><dd className="text-right tabular-nums">{formatUSD(spend)}</dd>
                  {next && (<><dt className="text-muted">Milestone</dt><dd className="text-right">{next.done ? "Met" : formatDate(next.due)}</dd></>)}
                </dl>
              </Card>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-faint">Payroll and indirect costs are shared across objectives and not split here.</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <h2 className="mb-2 text-sm font-semibold">Budget by category</h2>
          <Card className="divide-y divide-border">
            {spendByCategory(award, s.transactions).map((c) => (
              <div key={c.category} className="grid grid-cols-[7rem_1fr_auto] items-center gap-4 px-4 py-3 text-sm">
                <span>{c.category}</span>
                <ProgressBar ratio={c.ratio} label={`${c.category} spend`} />
                <span className="w-40 text-right text-xs tabular-nums text-muted">
                  <span className="text-text">{formatUSD(c.spent)}</span> / {formatUSD(c.approved)}
                </span>
              </div>
            ))}
          </Card>
        </section>
        <section className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold">Deadlines</h2>
          <Card className="divide-y divide-border">
            {milestones.map((m) => {
              const days = daysBetween(DEMO_TODAY, m.due);
              return (
                <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                  <span className={m.done ? "text-muted line-through" : ""}>{m.title}</span>
                  {m.done ? <Badge tone="good">Met</Badge> : <Badge tone={days <= 14 ? "warn" : "neutral"}>{formatDate(m.due)}</Badge>}
                </div>
              );
            })}
          </Card>
        </section>
      </div>
    </div>
  );
}
