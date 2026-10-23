/**
 * Work pulled from connected tools, mapped to objectives by AI and checked by people.
 */
"use client";

import { useState } from "react";
import { objectives } from "@/data/award";
import { evidence } from "@/data/evidence";
import { sourceName } from "@/lib/citations";
import { formatDate } from "@/lib/format";
import { REVIEW_CONFIDENCE } from "@/lib/metrics";
import type { Evidence, Source } from "@/lib/types";
import { Badge, Button, Card, SourceMark } from "../ui/primitives";
import type { GrantState } from "../useGrantState";

const NONE = "none";

/** Objective picker; "Not grant work" maps to null. */
function ObjectiveSelect({ item, s }: { item: Evidence; s: GrantState }) {
  const current = s.evidenceState[item.id]?.objectiveId ?? NONE;
  return (
    <select
      aria-label={`Objective for ${item.title}`}
      value={current}
      onChange={(ev) => s.assignEvidence(item.id, ev.target.value === NONE ? null : ev.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs"
    >
      {objectives.map((o) => <option key={o.id} value={o.id}>{o.code}. {o.title}</option>)}
      <option value={NONE}>Not grant work</option>
    </select>
  );
}

/** Confidence or confirmation label for one item. */
function MappingBadge({ item, s }: { item: Evidence; s: GrantState }) {
  const st = s.evidenceState[item.id];
  if (st?.confirmed) return <Badge tone="good">Confirmed</Badge>;
  if (st?.objectiveId === null) return <Badge tone="warn">Unmapped</Badge>;
  return <Badge tone={item.confidence < REVIEW_CONFIDENCE ? "warn" : "neutral"}>AI {Math.round(item.confidence * 100)}%</Badge>;
}

/** One evidence row. */
function Row({ item, s }: { item: Evidence; s: GrantState }) {
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
      <SourceMark source={item.source} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{item.title}</div>
        <div className="mt-0.5 text-xs text-muted">{item.ref} · {item.author} · {formatDate(item.date)}</div>
        <div className="mt-1 text-sm text-muted">{item.excerpt}</div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <MappingBadge item={item} s={s} />
        <ObjectiveSelect item={item} s={s} />
      </div>
    </div>
  );
}

/** Evidence tab with review queue and filters. */
export function EvidenceTab({ s }: { s: GrantState }) {
  const [source, setSource] = useState<Exclude<Source, "ramp"> | "all">("all");
  const [objective, setObjective] = useState<string>("all");
  const list = evidence
    .filter((e) => source === "all" || e.source === source)
    .filter((e) => objective === "all" || (s.evidenceState[e.id]?.objectiveId ?? NONE) === objective)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 rise">
      {s.queue.length > 0 ? (
        <section>
          <h2 className="mb-1 text-sm font-semibold">Needs a human check ({s.queue.length})</h2>
          <p className="mb-2 text-xs text-muted">GrantTrail was not sure where these belong. They stay out of the report until someone confirms them.</p>
          <Card className="divide-y divide-border border-warn/30">
            {s.queue.map((item) => {
              const suggested = objectives.find((o) => o.id === s.evidenceState[item.id]?.objectiveId);
              return (
                <div key={item.id} className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
                  <SourceMark source={item.source} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{item.title}</div>
                    <div className="mt-0.5 text-sm text-muted">{item.excerpt}</div>
                    <div className="mt-1 text-xs text-muted">
                      {suggested ? <>AI guess: {suggested.code} ({Math.round(item.confidence * 100)}% confident)</> : "AI could not match this to an objective"}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {suggested && <Button variant="primary" onClick={() => s.assignEvidence(item.id, suggested.id)}>Confirm {suggested.code}</Button>}
                    {objectives.filter((o) => o.id !== suggested?.id).map((o) => (
                      <Button key={o.id} onClick={() => s.assignEvidence(item.id, o.id)}>{o.code}</Button>
                    ))}
                    <Button variant="ghost" onClick={() => s.assignEvidence(item.id, null)}>Not grant work</Button>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>
      ) : (
        <Card className="p-4 text-sm text-muted">Review queue is clear. Every item is either confidently mapped or confirmed by a person.</Card>
      )}

      <section>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">All linked work ({list.length})</h2>
          <div className="flex flex-wrap gap-2">
            <select aria-label="Filter by source" value={source} onChange={(e) => setSource(e.target.value as typeof source)} className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
              <option value="all">All sources</option>
              {(["github", "linear", "docs"] as const).map((x) => <option key={x} value={x}>{sourceName(x)}</option>)}
            </select>
            <select aria-label="Filter by objective" value={objective} onChange={(e) => setObjective(e.target.value)} className="rounded-md border border-border bg-surface px-2 py-1 text-xs">
              <option value="all">All objectives</option>
              {objectives.map((o) => <option key={o.id} value={o.id}>{o.code}</option>)}
              <option value={NONE}>Not grant work</option>
            </select>
          </div>
        </div>
        <Card className="divide-y divide-border">
          {list.length === 0 ? <div className="p-4 text-sm text-muted">Nothing matches these filters.</div> : list.map((item) => <Row key={item.id} item={item} s={s} />)}
        </Card>
      </section>
    </div>
  );
}
