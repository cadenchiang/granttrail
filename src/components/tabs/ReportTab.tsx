/**
 * Cited report draft with gaps, per-section human review, approval and export.
 */
"use client";

import { useEffect, useState } from "react";
import { award } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions as sampleTransactions } from "@/data/transactions";
import { resolveCitation } from "@/lib/citations";
import { logEvent } from "@/lib/log";
import { sourcesUsed, summarizeRampSync } from "@/lib/rampSync";
import { countGaps, gapTarget, phaseTwoHeadStart, toMarkdown } from "@/lib/report";
import { Citation } from "../ui/Citation";
import { Badge, Button, Card, SourceMark } from "../ui/primitives";
import type { GrantState } from "../useGrantState";

const DRAFT_STEPS = ["Pulling synced Ramp transactions and receipts", "Retrieving linked evidence", "Writing each section from cited records", "Checking every claim has a source"];
const REPORT_TITLE = `${award.program} progress report: ${award.awardNumber}`;

/** Download the draft as Markdown; failures are logged and shown, never swallowed. */
function exportMarkdown(s: GrantState): string | null {
  try {
    const md = toMarkdown(REPORT_TITLE, s.sections, (id) => {
      const c = resolveCitation(id, s.citationCtx);
      return c ? `${c.label}: ${c.detail}` : null;
    });
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `granttrail-report-${award.awardNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
    logEvent("info", "report.export", "user exported draft", { bytes: md.length }, "Markdown file downloaded");
    return null;
  } catch (err) {
    logEvent("error", "report.export_failed", String(err), { awardNumber: award.awardNumber }, "No file downloaded; user shown an error");
    return "Export failed. Try again, or copy the draft from the page.";
  }
}

/**
 * Compact strip of the records the draft is built from.
 * @param rampConnected whether the simulated Ramp sync has run
 */
function SourcesUsed({ rampConnected }: { rampConnected: boolean }) {
  const rows = sourcesUsed(summarizeRampSync(sampleTransactions), evidence, rampConnected);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
      <span className="font-medium text-text">Sources used</span>
      {rows.map((r) => (
        <span key={r.source} className="inline-flex items-center gap-1.5"><SourceMark source={r.source} size={14} />{r.label}</span>
      ))}
    </div>
  );
}

/** Pre-draft state with a short staged animation. */
function DraftStart({ onDraft, rampConnected }: { onDraft: () => void; rampConnected: boolean }) {
  const [step, setStep] = useState(-1);
  useEffect(() => {
    if (step < 0) return;
    if (step >= DRAFT_STEPS.length) { onDraft(); return; }
    const t = setTimeout(() => setStep((x) => x + 1), 650);
    return () => clearTimeout(t);
  }, [step, onDraft]);
  return (
    <Card className="mx-auto max-w-xl p-6 text-center rise">
      <div className="font-medium">Draft the progress report</div>
      <p className="mt-1 text-sm text-muted">
        Every sentence links to a Ramp transaction, commit, ticket or doc. Where evidence is missing, the draft shows a gap instead of making something up.
      </p>
      <div className="mt-4 flex justify-center"><SourcesUsed rampConnected={rampConnected} /></div>
      {step < 0 ? (
        <Button variant="primary" className="mt-5" onClick={() => setStep(0)}>Draft report</Button>
      ) : (
        <ul className="mx-auto mt-5 w-fit space-y-2 text-left text-sm" aria-live="polite">
          {DRAFT_STEPS.map((label, i) => (
            <li key={label} className={`flex items-center gap-2 ${i > step ? "text-faint" : ""}`}>
              <span className={`h-2 w-2 rounded-full ${i < step ? "bg-good" : i === step ? "animate-pulse bg-accent" : "bg-border"}`} />
              {label}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Report tab. */
export function ReportTab({ s }: { s: GrantState }) {
  const [exportError, setExportError] = useState<string | null>(null);
  if (!s.reportGenerated) return <DraftStart onDraft={s.generateReport} rampConnected={s.rampConnected} />;

  const numbers = new Map<string, number>();
  const num = (id: string) => {
    if (!numbers.has(id)) numbers.set(id, numbers.size + 1);
    return numbers.get(id)!;
  };
  const claimCount = s.sections.reduce((n, sec) => n + sec.claims.length, 0);
  const gaps = countGaps(s.sections);
  const reviewedCount = s.sections.filter((sec) => s.reviewed[sec.id]).length;
  const allReviewed = reviewedCount === s.sections.length;
  const headStart = phaseTwoHeadStart(s.sections);

  return (
    <div className="space-y-4 rise">
      <Card className="sticky top-2 z-10 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 flex-wrap items-center gap-2 text-sm">
          <Badge tone="good">{claimCount} claims, all cited</Badge>
          <Badge tone={gaps > 0 ? "warn" : "good"}>{gaps} gap{gaps === 1 ? "" : "s"}</Badge>
          <Badge tone={allReviewed ? "good" : "neutral"}>{reviewedCount}/{s.sections.length} sections reviewed</Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setExportError(exportMarkdown(s))}>Export .md</Button>
          <Button variant="primary" disabled={!allReviewed || s.approved} onClick={s.approve}>{s.approved ? "Approved" : "Approve draft"}</Button>
        </div>
      </Card>
      {exportError && <Card className="border-bad/40 bg-bad-bg p-3 text-sm text-bad">{exportError}</Card>}
      {s.approved && (
        <Card className="border-good/30 bg-good-bg p-4 text-sm text-good">
          Approved{gaps > 0 ? ` with ${gaps} open gap${gaps === 1 ? "" : "s"}` : ""}. Ready to paste into the agency portal. GrantTrail never submits for you.
        </Card>
      )}
      {!allReviewed && <p className="text-xs text-muted">A person has to review every section before the draft can be approved.</p>}

      <Card className="p-6 sm:p-8">
        <div className="text-xs text-muted">{award.agency} · {award.program} · {award.company}</div>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{award.title}</h2>
        <div className="mt-2"><SourcesUsed rampConnected={s.rampConnected} /></div>
        <div className="mt-6 space-y-7">
          {s.sections.map((sec) => (
            <section key={sec.id} aria-labelledby={`h-${sec.id}`}>
              <div className="flex items-center justify-between gap-3 border-b border-border pb-1.5">
                <h3 id={`h-${sec.id}`} className="text-sm font-semibold">{sec.heading}</h3>
                <label className="flex cursor-pointer items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={!!s.reviewed[sec.id]} onChange={() => s.toggleReviewed(sec.id)} className="accent-[var(--good)]" />
                  Reviewed
                </label>
              </div>
              <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed">
                {sec.claims.map((c, i) => (
                  <li key={i}>
                    {c.text}
                    {c.citations.map((id) => <Citation key={id} id={id} n={num(id)} ctx={s.citationCtx} />)}
                  </li>
                ))}
              </ul>
              {sec.gaps.map((g) => (
                <div key={g.id} className="mt-2.5 rounded-lg border border-dashed border-warn/50 bg-warn-bg px-3 py-2 text-sm">
                  <span className="font-medium text-warn">Missing evidence.</span> <span className="text-text">{g.text}</span>
                  <span className="mt-0.5 block text-xs text-muted">GrantTrail left this blank on purpose.{" "}
                    <button className="underline underline-offset-2" onClick={() => s.setTab(gapTarget(g.id))}>{gapTarget(g.id) === "evidence" ? "Link evidence" : "Open the flag"}</button>
                  </span>
                </div>
              ))}
              {sec.claims.length === 0 && sec.gaps.length === 0 && <p className="mt-2 text-sm text-muted">Nothing to report.</p>}
            </section>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">Phase II head start</h2>
          <Badge tone="info">{headStart.length} reusable results</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">Measured results from this award, already cited, ready to become the preliminary data section of a Phase II proposal.</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          {headStart.map((c, i) => (
            <li key={i} className="flex gap-2"><span className="text-faint">•</span><span>{c.text}{c.citations.map((id) => <Citation key={id} id={id} n={num(id)} ctx={s.citationCtx} />)}</span></li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
