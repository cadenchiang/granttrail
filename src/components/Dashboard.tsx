/**
 * Grant Reports page after onboarding: award header, tab bar, active tab.
 */
import { award } from "@/data/award";
import { formatUSD } from "@/lib/format";
import { EvidenceTab } from "./tabs/EvidenceTab";
import { FlagsTab } from "./tabs/FlagsTab";
import { OverviewTab } from "./tabs/OverviewTab";
import { ReportTab } from "./tabs/ReportTab";
import type { GrantState, Tab } from "./useGrantState";

/** Renders the tab bar with live counts and the selected tab. */
export function Dashboard({ s }: { s: GrantState }) {
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "evidence", label: "Evidence", count: s.queue.length || undefined },
    { id: "flags", label: "Flags", count: s.openFlags.length || undefined },
    { id: "report", label: "Report draft" },
  ];
  return (
    <div>
      <div className="text-xs text-muted">{award.agency} · {award.program} · {award.awardNumber} · {formatUSD(award.amount)}</div>
      <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">{award.title}</h1>
      <div role="tablist" aria-label="Grant views" className="mt-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={s.tab === t.id}
            onClick={() => s.setTab(t.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition ${s.tab === t.id ? "border-text text-text" : "border-transparent text-muted hover:text-text"}`}
          >
            {t.label}
            {t.count !== undefined && <span className="rounded-full bg-warn-bg px-1.5 text-[11px] text-warn tabular-nums">{t.count}</span>}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="pt-6">
        {s.tab === "overview" && <OverviewTab s={s} />}
        {s.tab === "evidence" && <EvidenceTab s={s} />}
        {s.tab === "flags" && <FlagsTab s={s} />}
        {s.tab === "report" && <ReportTab s={s} />}
      </div>
    </div>
  );
}
