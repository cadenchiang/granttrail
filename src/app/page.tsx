/**
 * GrantTrail demo entry: onboarding until the award is set up, then the dashboard.
 */
"use client";

import { AppShell } from "@/components/AppShell";
import { Dashboard } from "@/components/Dashboard";
import { Onboarding } from "@/components/Onboarding";
import { useGrantState } from "@/components/useGrantState";

export default function Home() {
  const s = useGrantState();
  return (
    <AppShell onReset={s.reset}>
      {s.phase === "app" ? <Dashboard s={s} /> : <Onboarding phase={s.phase} setPhase={s.setPhase} />}
    </AppShell>
  );
}
