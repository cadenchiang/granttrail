/**
 * First-run flow: upload the award, watch it parse, confirm the extracted
 * checklist, then connect work tools.
 */
"use client";

import { useEffect, useState } from "react";
import { award, milestones, objectives } from "@/data/award";
import { formatDate, formatUSD } from "@/lib/format";
import { logEvent } from "@/lib/log";
import { Badge, Button, Card, SourceMark } from "./ui/primitives";
import type { Phase } from "./useGrantState";

const PARSE_STEPS = [
  `Reading award agreement (${award.pages} pages)`,
  "Extracting technical objectives",
  "Finding milestones and reporting deadlines",
  "Matching budget lines to Ramp spend categories",
];
const STEP_MS = 700;

/** Award drop zone. The demo always uses the sample award. */
function Upload({ onNext }: { onNext: () => void }) {
  return (
    <div className="mx-auto max-w-2xl rise">
      <h1 className="text-2xl font-semibold tracking-tight">Grant Reports</h1>
      <p className="mt-1 text-sm text-muted">
        Upload your award. GrantTrail turns it into a checklist, tracks progress as your team works, and drafts the report with every claim linked to evidence.
      </p>
      <Card className="mt-6 border-dashed p-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-surface-2 text-lg ring-1 ring-border" aria-hidden>↑</div>
        <div className="mt-3 text-sm font-medium">Drop your award agreement and approved proposal</div>
        <div className="mt-1 text-xs text-muted">PDF. In this demo, a sample NSF SBIR Phase I award is used.</div>
        <Button variant="primary" className="mt-5" onClick={onNext}>Use sample award</Button>
      </Card>
    </div>
  );
}

/** Staged parsing animation; advances itself when done. */
function Parsing({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= PARSE_STEPS.length) {
      const t = setTimeout(onDone, 300);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEP_MS);
    return () => clearTimeout(t);
  }, [step, onDone]);
  return (
    <Card className="mx-auto max-w-xl p-6 rise">
      <div className="text-sm font-medium">award-{award.awardNumber}.pdf</div>
      <ul className="mt-4 space-y-2.5 text-sm" aria-live="polite">
        {PARSE_STEPS.map((label, i) => (
          <li key={label} className={`flex items-center gap-2.5 ${i > step ? "text-faint" : ""}`}>
            <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${i < step ? "bg-good text-white" : i === step ? "animate-pulse bg-accent" : "bg-border"}`}>
              {i < step ? "✓" : ""}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Extracted checklist with page references, for the founder to confirm. */
function Checklist({ onNext }: { onNext: () => void }) {
  return (
    <div className="mx-auto max-w-3xl rise">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold tracking-tight">Check what GrantTrail found</h1>
        <span className="text-xs text-muted">Each item links to where it appears in the award</span>
      </div>
      <Card className="mt-4 p-5">
        <div className="text-xs text-muted">{award.agency} · {award.program} · {award.awardNumber}</div>
        <div className="mt-1 font-medium">{award.title}</div>
        <div className="mt-1 text-sm text-muted">{formatUSD(award.amount)} · {formatDate(award.start)} to {formatDate(award.end)}</div>
      </Card>
      <h2 className="mt-6 text-sm font-semibold">Technical objectives</h2>
      <div className="mt-2 space-y-2">
        {objectives.map((o) => (
          <Card key={o.id} className="flex items-start justify-between gap-4 p-4">
            <div>
              <div className="text-sm font-medium">{o.code}. {o.title}</div>
              <div className="mt-0.5 text-sm text-muted">{o.target}</div>
            </div>
            <Badge>{o.sourceRef}</Badge>
          </Card>
        ))}
      </div>
      <h2 className="mt-6 text-sm font-semibold">Milestones and deadlines</h2>
      <Card className="mt-2 divide-y divide-border">
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
            <span>{m.title}</span>
            <span className="flex items-center gap-3 text-muted">
              <span className="tabular-nums">{formatDate(m.due)}</span>
              <Badge>{m.sourceRef}</Badge>
            </span>
          </div>
        ))}
      </Card>
      <div className="mt-6 flex justify-end">
        <Button variant="primary" onClick={onNext}>Looks right, continue</Button>
      </div>
    </div>
  );
}

const TOOLS = [
  { id: "github", name: "GitHub", note: "Commits and pull requests" },
  { id: "linear", name: "Linear", note: "Issues and project status" },
  { id: "docs", name: "Google Docs", note: "Design docs, eval notes, meeting notes" },
] as const;

/** Simulated tool connections; Ramp is already connected. */
function Connect({ onNext }: { onNext: () => void }) {
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const all = TOOLS.every((t) => connected[t.id]);
  return (
    <div className="mx-auto max-w-xl rise">
      <h1 className="text-xl font-semibold tracking-tight">Connect where the work happens</h1>
      <p className="mt-1 text-sm text-muted">GrantTrail reads activity and maps it to objectives as it happens. It never writes to these tools.</p>
      <Card className="mt-5 divide-y divide-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <SourceMark source="ramp" />
          <div className="flex-1 text-sm"><div className="font-medium">Ramp</div><div className="text-muted">Spend coded to this award</div></div>
          <Badge tone="good">Connected</Badge>
        </div>
        {TOOLS.map((t) => (
          <div key={t.id} className="flex items-center gap-3 px-4 py-3">
            <SourceMark source={t.id} />
            <div className="flex-1 text-sm"><div className="font-medium">{t.name}</div><div className="text-muted">{t.note}</div></div>
            {connected[t.id] ? (
              <Badge tone="good">Connected</Badge>
            ) : (
              <Button onClick={() => { setConnected((c) => ({ ...c, [t.id]: true })); logEvent("info", "tool.connect", "user clicked connect", { tool: t.id }, "Simulated connection; sample activity will be used"); }}>Connect</Button>
            )}
          </div>
        ))}
      </Card>
      <div className="mt-6 flex items-center justify-end gap-2">
        {!all && <Button variant="ghost" onClick={() => setConnected({ github: true, linear: true, docs: true })}>Connect all</Button>}
        <Button variant="primary" disabled={!all} onClick={onNext}>Map work to objectives</Button>
      </div>
    </div>
  );
}

/**
 * Renders the step for the current onboarding phase.
 * @param phase must not be "app"; the caller renders the dashboard instead
 */
export function Onboarding({ phase, setPhase }: { phase: Exclude<Phase, "app">; setPhase: (p: Phase) => void }) {
  if (phase === "upload") return <Upload onNext={() => setPhase("parsing")} />;
  if (phase === "parsing") return <Parsing onDone={() => setPhase("checklist")} />;
  if (phase === "checklist") return <Checklist onNext={() => setPhase("connect")} />;
  return <Connect onNext={() => setPhase("app")} />;
}
