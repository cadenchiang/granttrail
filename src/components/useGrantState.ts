/**
 * All demo state in one hook: onboarding phase, tab, evidence mapping, flag
 * decisions and report review. Every user action is logged with cause and impact.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { award, DEMO_TODAY, milestones, objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { transactions as rawTransactions } from "@/data/transactions";
import { resolveCitation, type CitationContext } from "@/lib/citations";
import { applyResolutions, detectFlags } from "@/lib/flags";
import { logEvent } from "@/lib/log";
import { initialEvidenceState, reviewQueue } from "@/lib/metrics";
import { deriveObjectives, diffProgress, type ProgressChange } from "@/lib/progress";
import { buildReport } from "@/lib/report";
import type { EvidenceState, FlagStatus } from "@/lib/types";

export type Phase = "upload" | "checklist" | "connect" | "app";
export type Tab = "overview" | "evidence" | "flags" | "report";

/** Hook return value; see field comments in the implementation. */
export type GrantState = ReturnType<typeof useGrantState>;

export function useGrantState() {
  const [phase, setPhaseRaw] = useState<Phase>("upload");
  const [tab, setTabRaw] = useState<Tab>("overview");
  const [evidenceState, setEvidenceState] = useState<Record<string, EvidenceState>>(() => initialEvidenceState(evidence));
  const [flagDecisions, setFlagDecisions] = useState<Record<string, FlagStatus>>({});
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({});
  const [approved, setApproved] = useState(false);
  const [rampSyncedAt, setRampSyncedAt] = useState<string | null>(null);
  const rampConnected = rampSyncedAt !== null;
  /** Most recent progress change caused by a mapping decision, shown as a notice. */
  const [progressNotice, setProgressNotice] = useState<{ key: number; changes: ProgressChange[] } | null>(null);

  // Status and progress come from evidence, so every mapping decision can move them.
  const liveObjectives = useMemo(
    () => deriveObjectives(objectives, evidence, evidenceState, milestones, DEMO_TODAY),
    [evidenceState],
  );

  // Notices clear themselves after a few seconds.
  useEffect(() => {
    if (!progressNotice) return;
    const t = setTimeout(() => setProgressNotice(null), 7000);
    return () => clearTimeout(t);
  }, [progressNotice]);

  const queue = useMemo(() => reviewQueue(evidence, evidenceState), [evidenceState]);
  const flags = useMemo(
    () => detectFlags({ objectives: liveObjectives, milestones, evidence, evidenceState, transactions: rawTransactions, today: DEMO_TODAY, reviewCount: queue.length }),
    [liveObjectives, evidenceState, queue.length],
  );
  // Every detected flag gets a status; undecided ones are open. The review flag clears itself.
  const flagStatus = useMemo<Record<string, FlagStatus>>(
    () => Object.fromEntries(flags.map((f) => [f.id, f.kind === "review" ? "open" : (flagDecisions[f.id] ?? "open")])),
    [flags, flagDecisions],
  );
  const transactions = useMemo(() => applyResolutions(rawTransactions, flagStatus), [flagStatus]);
  const sections = useMemo(
    () => buildReport({ award, objectives: liveObjectives, evidence, evidenceState, transactions, flagStatus, today: DEMO_TODAY }),
    [liveObjectives, evidenceState, transactions, flagStatus],
  );
  const citationCtx: CitationContext = useMemo(() => ({ award, evidence, transactions }), [transactions]);
  const openFlags = flags.filter((f) => flagStatus[f.id] === "open");

  /** Any change to the underlying records invalidates a prior approval. */
  const invalidateApproval = useCallback((cause: string) => {
    if (approved) logEvent("warn", "report.approval_cleared", cause, {}, "Report needs re-approval because its evidence changed");
    setApproved(false);
  }, [approved]);

  const setPhase = useCallback((next: Phase) => {
    logEvent("info", "onboarding.phase", "user advanced onboarding", { to: next }, `Showing ${next} step`);
    setPhaseRaw(next);
  }, []);

  const setTab = useCallback((next: Tab) => {
    logEvent("info", "nav.tab", "user selected tab", { to: next }, `Showing ${next} tab`);
    setTabRaw(next);
  }, []);

  const assignEvidence = useCallback((id: string, objectiveId: string | null) => {
    if (!evidence.some((e) => e.id === id)) {
      logEvent("error", "evidence.assign_failed", "unknown evidence id", { id, objectiveId }, "No mapping changed");
      return;
    }
    if (objectiveId !== null && !objectives.some((o) => o.id === objectiveId)) {
      logEvent("error", "evidence.assign_failed", "unknown objective id", { id, objectiveId }, "No mapping changed");
      return;
    }
    const next = { ...evidenceState, [id]: { objectiveId, confirmed: true } };
    const changes = diffProgress(liveObjectives, deriveObjectives(objectives, evidence, next, milestones, DEMO_TODAY));
    setEvidenceState(next);
    if (changes.length > 0) setProgressNotice({ key: Date.now(), changes });
    logEvent("info", "evidence.assign", "user confirmed or changed mapping", { id, objectiveId, progressChanges: changes }, "Overview, flags and report now use this mapping");
    invalidateApproval("evidence mapping changed");
  }, [evidenceState, liveObjectives, invalidateApproval]);

  const setFlag = useCallback((id: string, status: FlagStatus) => {
    setFlagDecisions((d) => ({ ...d, [id]: status }));
    logEvent("info", "flag.set", "user acted on flag", { id, status }, status === "resolved" ? "Report section updates from gap to cited claim" : "Flag reopened; report shows the gap again");
    invalidateApproval("flag status changed");
  }, [invalidateApproval]);

  const generateReport = useCallback(() => {
    const broken = sections.flatMap((s) => s.claims.flatMap((c) => c.citations)).filter((id) => !resolveCitation(id, citationCtx));
    if (broken.length > 0) {
      logEvent("error", "report.broken_citations", "draft references missing records", { broken }, "Draft shown with unresolved citations marked");
    }
    setReportGenerated(true);
    logEvent("info", "report.generate", "user requested draft", { sections: sections.length }, "Draft report visible for review");
  }, [sections, citationCtx]);

  const toggleReviewed = useCallback((sectionId: string) => {
    setReviewed((r) => ({ ...r, [sectionId]: !r[sectionId] }));
    logEvent("info", "report.section_review", "user toggled section review", { sectionId }, "Approval gate re-evaluated");
    invalidateApproval("section review changed");
  }, [invalidateApproval]);

  const approve = useCallback(() => {
    const unreviewed = sections.filter((s) => !reviewed[s.id]).map((s) => s.id);
    if (unreviewed.length > 0) {
      logEvent("warn", "report.approve_blocked", "sections not reviewed", { unreviewed }, "Approval refused");
      return;
    }
    setApproved(true);
    logEvent("info", "report.approve", "user approved draft", {}, "Report marked ready to submit (GrantTrail never submits for you)");
  }, [sections, reviewed]);

  /** Records a finished (simulated) Ramp sync; called by the Ramp connect modal. */
  const connectRamp = useCallback((syncedAt: string, transactionCount: number) => {
    setRampSyncedAt(syncedAt);
    logEvent("info", "ramp.connected", "simulated Ramp sync finished", { syncedAt, transactionCount }, "Ramp shows as connected; its sample transactions feed the report");
  }, []);

  const reset = useCallback(() => {
    setPhaseRaw("upload");
    setTabRaw("overview");
    setEvidenceState(initialEvidenceState(evidence));
    setFlagDecisions({});
    setReportGenerated(false);
    setReviewed({});
    setApproved(false);
    setRampSyncedAt(null);
    setProgressNotice(null);
    logEvent("info", "demo.reset", "user reset demo", {}, "All demo state cleared");
  }, []);

  return {
    phase, setPhase, tab, setTab,
    objectives: liveObjectives, progressNotice, dismissProgressNotice: () => setProgressNotice(null),
    evidenceState, assignEvidence, queue,
    flags, flagStatus, openFlags, setFlag,
    transactions, sections, citationCtx,
    reportGenerated, generateReport, reviewed, toggleReviewed, approved, approve,
    rampConnected, rampSyncedAt, connectRamp,
    reset,
  };
}
