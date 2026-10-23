/**
 * Small presentational building blocks shared by every tab.
 */
import type { ReactNode } from "react";
import type { Source } from "@/lib/types";

/** White panel with a hairline border. */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-border bg-surface ${className}`}>{children}</div>;
}

export type Tone = "neutral" | "good" | "warn" | "bad" | "info";

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted border-border",
  good: "bg-good-bg text-good border-transparent",
  warn: "bg-warn-bg text-warn border-transparent",
  bad: "bg-bad-bg text-bad border-transparent",
  info: "bg-info-bg text-info border-transparent",
};

/** Compact status label. */
export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/**
 * Horizontal bar. `ratio` is clamped to 0..1 for drawing; overspend shows as a full red bar.
 */
export function ProgressBar({ ratio, tone = "neutral", label }: { ratio: number; tone?: Tone; label: string }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  const fill = { neutral: "bg-text", good: "bg-good", warn: "bg-warn", bad: "bg-bad", info: "bg-info" }[ratio > 1 ? "bad" : tone];
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border" role="progressbar" aria-label={label} aria-valuenow={Math.round(ratio * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${fill} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost";

/** Button with three visual weights. Primary uses the accent color. */
export function Button({
  children, onClick, variant = "secondary", disabled = false, className = "", type = "button",
}: {
  children: ReactNode; onClick?: () => void; variant?: ButtonVariant; disabled?: boolean; className?: string; type?: "button" | "submit";
}) {
  const styles: Record<ButtonVariant, string> = {
    primary: "bg-accent text-accent-ink hover:brightness-95",
    secondary: "border border-border bg-surface text-text hover:bg-surface-2",
    ghost: "text-muted hover:text-text hover:bg-surface-2",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

const SOURCE_MARKS: Record<Source | "award", { letter: string; cls: string; name: string }> = {
  github: { letter: "G", cls: "bg-[#24292f] text-white", name: "GitHub" },
  linear: { letter: "L", cls: "bg-[#5e6ad2] text-white", name: "Linear" },
  docs: { letter: "D", cls: "bg-[#1a73e8] text-white", name: "Google Docs" },
  ramp: { letter: "R", cls: "bg-accent text-accent-ink", name: "Ramp" },
  award: { letter: "A", cls: "bg-text text-white", name: "Award" },
};

/** Square letter mark standing in for a source's logo. */
export function SourceMark({ source, size = 20 }: { source: Source | "award"; size?: number }) {
  const m = SOURCE_MARKS[source];
  return (
    <span
      title={m.name}
      aria-label={m.name}
      className={`inline-flex shrink-0 items-center justify-center rounded-[5px] font-semibold ${m.cls}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {m.letter}
    </span>
  );
}

/** Large number with a label and optional sub-line. */
export function Stat({ label, value, sub, children }: { label: string; value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <Card className="h-full p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
      {children && <div className="mt-3">{children}</div>}
    </Card>
  );
}
