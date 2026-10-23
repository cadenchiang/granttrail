/**
 * Simulated "Connect Ramp" flow: a read-only consent screen, a staged sync that
 * ticks through the sample data, and a summary of what was found. Nothing leaves the browser.
 */
"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { award } from "@/data/award";
import { transactions } from "@/data/transactions";
import { formatUSD } from "@/lib/format";
import { logEvent } from "@/lib/log";
import { RAMP_SYNC_STEP_MS, grantFieldLabel, rampSyncSteps, summarizeRampSync, syncProgress, tickCount } from "@/lib/rampSync";
import { Badge, Button, ProgressBar, SourceMark } from "./ui/primitives";

type Stage = "authorize" | "syncing" | "done";
const TICK_MS = 80;

const SCOPES = [
  "Transactions and memos",
  "Receipts and line items",
  "Cards and spend programs",
  "Bills and vendors",
  `Accounting codes and custom fields (${grantFieldLabel(award)})`,
];

/** Read-only consent screen. No credentials are asked for. */
function Authorize({ onCancel, onAuthorize }: { onCancel: () => void; onAuthorize: () => void }) {
  return (
    <>
      <p className="mt-1 text-sm text-muted">GrantTrail would like to access your Ramp business account.</p>
      <div className="mt-4 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm">
        <div className="text-xs text-muted">Workspace</div>
        <div className="font-medium">{award.company}</div>
      </div>
      <div className="mt-4 text-xs font-medium text-muted">GrantTrail will be able to read</div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {SCOPES.map((s) => (
          <li key={s} className="flex gap-2"><span className="text-good" aria-hidden>✓</span><span>{s}</span></li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">Read-only. GrantTrail never moves money or edits records.</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={onAuthorize}>Authorize</Button>
      </div>
    </>
  );
}

/** Staged sync list; counts tick up on the running row. */
function Syncing({ elapsed, onCancel }: { elapsed: number; onCancel: () => void }) {
  const steps = useMemo(() => rampSyncSteps(summarizeRampSync(transactions)), []);
  const p = syncProgress(elapsed, steps.length, RAMP_SYNC_STEP_MS);
  const overall = Math.min(1, elapsed / (steps.length * RAMP_SYNC_STEP_MS));
  return (
    <>
      <p className="mt-1 text-sm text-muted">Pulling {award.company} data from Ramp and matching it to the award.</p>
      <div className="mt-4"><ProgressBar ratio={overall} tone="good" label="Ramp sync progress" /></div>
      <ul className="mt-4 space-y-2.5 text-sm" aria-live="polite">
        {steps.map((st, i) => {
          const shown = i < p.activeStep ? st.target : i === p.activeStep ? tickCount(st.target, p.fraction) : null;
          return (
            <li key={st.id} className={`flex items-center gap-2.5 ${i > p.activeStep ? "text-faint" : ""}`}>
              <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${i < p.activeStep ? "bg-good text-white" : i === p.activeStep ? "animate-pulse bg-accent" : "bg-border"}`}>
                {i < p.activeStep ? "✓" : ""}
              </span>
              <span className="flex-1">{st.label}</span>
              {shown !== null && <span className="text-xs text-muted tabular-nums">{shown.toLocaleString("en-US")} {st.unit}</span>}
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </>
  );
}

/** What the sync found, computed from the sample transactions. */
function Done({ onDone }: { onDone: () => void }) {
  const s = summarizeRampSync(transactions);
  const rows = [
    `${s.count} transactions coded to ${award.awardNumber}, ${formatUSD(s.total)} total`,
    `${s.receipts} receipts downloaded (${s.itemized} itemized)`,
    `${s.mapped} mapped to technical objectives`,
    `${s.shared} payroll and indirect entries shared across objectives`,
  ];
  return (
    <>
      <p className="mt-1 text-sm text-muted">Ramp data is ready for the grant report.</p>
      <ul className="mt-4 space-y-1.5 text-sm">
        {rows.map((r) => <li key={r} className="flex gap-2"><span className="text-good" aria-hidden>✓</span><span>{r}</span></li>)}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        {s.needsReview > 0 && <Badge tone="warn">{s.needsReview} need{s.needsReview === 1 ? "s" : ""} review</Badge>}
        {s.equipmentFlagged > 0 && <Badge tone="warn">{s.equipmentFlagged} equipment purchase{s.equipmentFlagged === 1 ? "" : "s"} flagged</Badge>}
      </div>
      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={onDone}>Done</Button>
      </div>
    </>
  );
}

/**
 * Modal dialog for the simulated Ramp connection.
 * @param onClose closes the modal; Ramp stays unconnected unless the sync finished
 * @param onConnected called once when the sync finishes, with the sync time and transaction count
 */
export function RampConnect({ onClose, onConnected }: { onClose: () => void; onConnected: (syncedAt: string, count: number) => void }) {
  const [stage, setStage] = useState<Stage>("authorize");
  const [elapsed, setElapsed] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const onConnectedRef = useRef(onConnected);
  useEffect(() => { onConnectedRef.current = onConnected; }, [onConnected]);

  // Focus moves into the dialog on open and on each stage change; restored on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    return () => prev?.focus?.();
  }, []);
  useEffect(() => {
    const el = dialogRef.current?.querySelector<HTMLElement>("button");
    (el ?? dialogRef.current)?.focus();
  }, [stage]);

  // Sync timer; cleared on cancel, completion and unmount.
  useEffect(() => {
    if (stage !== "syncing") return;
    const started = Date.now();
    const total = rampSyncSteps(summarizeRampSync(transactions)).length * RAMP_SYNC_STEP_MS;
    const id = setInterval(() => {
      const t = Date.now() - started;
      setElapsed(t);
      if (t >= total) {
        clearInterval(id);
        setStage("done");
        onConnectedRef.current(new Date().toISOString(), transactions.length);
      }
    }, TICK_MS);
    return () => clearInterval(id);
  }, [stage]);

  const cancel = (cause: string) => {
    logEvent("info", stage === "syncing" ? "ramp.sync_cancelled" : "ramp.authorize_cancelled", cause, { stage, elapsedMs: elapsed }, "Ramp left unconnected; nothing was synced");
    onClose();
  };
  const authorize = () => {
    logEvent("info", "ramp.authorize", "user authorized read-only access", { workspace: award.company }, "Simulated sync of sample Ramp data started");
    setElapsed(0);
    setStage("syncing");
  };
  const finish = () => {
    logEvent("info", "ramp.done", "user closed sync summary", { transactions: transactions.length }, "Back to the connect step with Ramp connected");
    onClose();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") { e.stopPropagation(); if (stage === "done") finish(); else cancel("user pressed Escape"); return; }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
    if (items.length === 0) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const title = stage === "authorize" ? "Connect Ramp" : stage === "syncing" ? "Syncing Ramp data" : "Ramp connected";
  // Portal to body: the onboarding step's `rise` transform would otherwise clip a fixed overlay to that step.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ramp-connect-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl outline-none rise"
      >
        <div className="flex items-center gap-2.5">
          <SourceMark source="ramp" size={24} />
          <h2 id="ramp-connect-title" className="text-base font-semibold tracking-tight">{title}</h2>
        </div>
        {stage === "authorize" && <Authorize onCancel={() => cancel("user clicked Cancel")} onAuthorize={authorize} />}
        {stage === "syncing" && <Syncing elapsed={elapsed} onCancel={() => cancel("user clicked Cancel")} />}
        {stage === "done" && <Done onDone={finish} />}
      </div>
    </div>,
    document.body,
  );
}
