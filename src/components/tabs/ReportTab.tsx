/**
 * Cited report draft with gaps, per-section human review, approval and export.
 */
"use client";

import { useEffect, useState } from "react";
import { award, DEMO_TODAY, milestones } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions as sampleTransactions } from "@/data/transactions";
import { resolveCitation } from "@/lib/citations";
import { logEvent } from "@/lib/log";
import { sourcesUsed, summarizeRampSync } from "@/lib/rampSync";
import { formatDate } from "@/lib/format";
import { countGaps, gapTarget, nextReportDeadline, phaseTwoHeadStart, toPlainText } from "@/lib/report";
import { textToPdf } from "@/lib/pdf";
import { Citation } from "../ui/Citation";
import { Badge, Button, Card, SourceMark } from "../ui/primitives";
import type { GrantState } from "../useGrantState";

const DRAFT_STEPS = ["Pulling synced Ramp transactions and receipts", "Retrieving linked evidence", "Writing each section from cited records", "Checking every claim has a source"];
const REPORT_TITLE = `${award.program} progress report: ${award.awardNumber}`;

/** Citation id to "label: detail" for exports. */
const citationLabel = (s: GrantState) => (id: string) => {
  const c = resolveCitation(id, s.citationCtx);
  if (!c) return null;
  // docs evidence uses its title as the label, so skip the repeat
  return c.detail.startsWith(c.label) ? c.detail : `${c.label}: ${c.detail}`;
};

/** Download the draft as a PDF; failures are logged and shown, never swallowed. */
function exportPdf(s: GrantState): string | null {
  try {
    const bytes = textToPdf(toPlainText(REPORT_TITLE, s.sections, citationLabel(s)));
    const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `granttrail-report-${award.awardNumber}.pdf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logEvent("info", "report.export", "user exported draft as PDF", { bytes: bytes.length }, "PDF file downloaded");
    return null;
  } catch (err) {
    logEvent("error", "report.export_failed", String(err), { awardNumber: award.awardNumber }, "No file downloaded; user shown an error");
    return "Export failed. Try again, or use Copy for Research.gov.";
  }
}

/**
 * Copy the draft as plain text for an agency portal. Uses the Clipboard API and
 * falls back to a hidden textarea where that API is blocked.
 * @returns an error message, or null on success
 */
async function copyPlainText(s: GrantState): Promise<string | null> {
  const text = toPlainText(REPORT_TITLE, s.sections, citationLabel(s));
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      if (!ok) throw new Error("execCommand copy returned false");
    }
    logEvent("info", "report.copy", "user copied plain-text report", { chars: text.length }, "Report text on clipboard for the agency portal");
    return null;
  } catch (err) {
    logEvent("error", "report.copy_failed", String(err), {}, "Nothing copied; user shown an error");
    return "Couldn't copy to the clipboard. Use Download PDF instead.";
  }
}

/**
 * The end of the flow: shown once the draft is approved. The person copies or
 * downloads the report and submits it themselves; GrantTrail never submits.
 */
function ReadyToSubmit({ s, gaps }: { s: GrantState; gaps: number }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deadline = nextReportDeadline(milestones, DEMO_TODAY);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2500);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <Card className="rise border-good/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span aria-hidden className="flex h-5 w-5 items-center justify-center rounded-full bg-good text-[11px] text-white">✓</span>
            <h2 className="text-base font-semibold tracking-tight">Ready to submit</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            Every section is reviewed{gaps === 0 ? " and every claim cites a record" : ""}. Paste the text into the {award.agency} project report on Research.gov.
          </p>
          {gaps > 0 && (
            <p className="mt-2 text-sm text-warn">
              {gaps} gap{gaps === 1 ? " is" : "s are"} still open and will paste as [MISSING EVIDENCE] so nothing goes in unnoticed.
            </p>
          )}
        </div>
        {deadline && (
          <div className="shrink-0 rounded-xl border border-border px-4 py-3 text-sm sm:text-right">
            <div className="text-xs text-muted">{deadline.title}</div>
            <div className="mt-0.5 font-semibold tabular-nums">{formatDate(deadline.due)}</div>
            <div className="text-xs text-muted">
              {deadline.daysLeft >= 0 ? `${deadline.daysLeft} days left` : `${-deadline.daysLeft} days overdue`} · {deadline.sourceRef}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="primary" onClick={async () => {
          const err = await copyPlainText(s);
          setError(err);
          setCopied(err === null);
        }}>
          {copied ? "Copied ✓" : "Copy for Research.gov"}
        </Button>
        <Button onClick={() => setError(exportPdf(s))}>Download PDF</Button>
      </div>
      {error && <p className="mt-2 text-sm text-bad">{error}</p>}

      <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
        GrantTrail never submits for you. Your team signs and submits, so your team stays accountable for what the agency sees.
      </p>
    </Card>
  );
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
          <Button variant="primary" disabled={!allReviewed || s.approved} onClick={s.approve}>{s.approved ? "Approved" : "Approve draft"}</Button>
        </div>
      </Card>
      {s.approved && <ReadyToSubmit s={s} gaps={gaps} />}
      {!allReviewed && <p className="text-xs text-muted">Review every section to approve the draft. Copy and download unlock after approval.</p>}

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
