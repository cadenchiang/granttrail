/**
 * Reportable items teams forget, each with the rule behind it and one action.
 */
import type { Flag, FlagKind } from "@/lib/types";
import { Citation } from "../ui/Citation";
import { Badge, Button, Card, type Tone } from "../ui/primitives";
import type { GrantState } from "../useGrantState";

const KINDS: Record<FlagKind, { label: string; tone: Tone }> = {
  equipment: { label: "Equipment", tone: "info" },
  invention: { label: "Possible invention", tone: "info" },
  unallowable: { label: "Unallowable cost", tone: "bad" },
  progress: { label: "Progress", tone: "warn" },
  review: { label: "Human review", tone: "warn" },
};

/** One flag card with its action or resolved state. */
function FlagCard({ f, s }: { f: Flag; s: GrantState }) {
  const isResolved = s.flagStatus[f.id] === "resolved";
  const act = () => (f.kind === "review" ? s.setTab("evidence") : s.setFlag(f.id, "resolved"));
  return (
    <Card className={`p-4 ${isResolved ? "opacity-70" : ""}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={KINDS[f.kind].tone}>{KINDS[f.kind].label}</Badge>
            {isResolved && <Badge tone="good">✓ {f.resolvedLabel}</Badge>}
          </div>
          <div className="mt-2 text-sm font-medium">{f.title}</div>
          <div className="mt-1 text-sm text-muted">{f.detail}</div>
          <div className="mt-2 text-xs text-faint">
            <span className="font-medium text-muted">Rule:</span> {f.rule}
          </div>
          {f.refs.length > 0 && (
            <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted">
              Evidence:{f.refs.map((id, i) => <Citation key={id} id={id} n={i + 1} ctx={s.citationCtx} />)}
            </div>
          )}
        </div>
        <div className="shrink-0">
          {isResolved ? (
            <Button variant="ghost" onClick={() => s.setFlag(f.id, "open")}>Undo</Button>
          ) : (
            <Button variant="primary" onClick={act}>{f.actionLabel}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Flags tab: open flags first, then resolved. */
export function FlagsTab({ s }: { s: GrantState }) {
  const open = s.flags.filter((f) => s.flagStatus[f.id] === "open");
  const done = s.flags.filter((f) => s.flagStatus[f.id] === "resolved");
  return (
    <div className="space-y-6 rise">
      <p className="text-sm text-muted">
        Things the report has to cover that are easy to miss. Resolving a flag updates the report draft; an open flag stays in the draft as a gap.
      </p>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Open ({open.length})</h2>
        {open.length === 0 ? <Card className="p-4 text-sm text-muted">Nothing open. Every reportable item has been handled.</Card> : open.map((f) => <FlagCard key={f.id} f={f} s={s} />)}
      </section>
      {done.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Resolved ({done.length})</h2>
          {done.map((f) => <FlagCard key={f.id} f={f} s={s} />)}
        </section>
      )}
    </div>
  );
}
