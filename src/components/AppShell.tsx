/**
 * Finance-app frame: sidebar with the new Grant Reports tab, plus a concept banner
 * so nobody mistakes the demo for a shipped product.
 */
import type { ReactNode } from "react";

const NAV = ["Home", "Insights", "Cards", "Expenses", "Bill Pay", "Vendors", "Accounting"];

/**
 * @param children the Grant Reports page content
 * @param onReset clears all demo state
 */
export function AppShell({ children, onReset }: { children: ReactNode; onReset: () => void }) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 md:flex">
        <div className="mb-6 flex items-center gap-2 px-2">
          <span className="text-[15px] font-semibold tracking-tight">Ramp</span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted ring-1 ring-border">concept</span>
        </div>
        <nav aria-label="Main" className="flex flex-col gap-0.5 text-sm">
          {NAV.map((item) => (
            <span key={item} aria-disabled className="cursor-default rounded-md px-2 py-1.5 text-muted">
              {item}
            </span>
          ))}
          <span aria-current="page" className="mt-1 flex items-center justify-between rounded-md bg-surface-2 px-2 py-1.5 font-medium ring-1 ring-border">
            Grant Reports
            <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">New</span>
          </span>
        </nav>
        <div className="mt-auto px-2 text-[11px] leading-relaxed text-faint">
          GrantTrail concept. Sample data for a fictional company.
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2 text-xs text-muted sm:px-8">
          <span>
            <span className="font-medium text-text">Concept demo.</span> Halcyon Labs and its award are fictional. Nothing connects to real accounts.
          </span>
          <button onClick={onReset} className="shrink-0 rounded-md px-2 py-1 font-medium text-text hover:bg-surface-2">
            Reset demo
          </button>
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
