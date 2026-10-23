# GrantTrail

Concept demo of a Grant Reports tab inside Ramp: upload an R&D grant award, map the team's work (GitHub, Linear, Google Docs) and spend (Ramp) to each objective, catch reportable items (equipment, inventions, unallowable costs, slipping milestones), and draft a progress report where every claim links to evidence and missing evidence shows up as a gap.

All data is sample data for a fictional company (Halcyon Labs). Nothing connects to real accounts, and the "AI" steps are simulated with deterministic logic so the demo is repeatable.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # unit tests (vitest)
npm run build
```

## Layout

- `src/data/` sample award, transactions, evidence
- `src/lib/` pure logic: metrics, flag detection, citations, report builder, logging (all unit tested in `tests/`)
- `src/components/` app shell, onboarding, tabs (Overview, Evidence, Flags, Report draft)

User actions are logged as structured JSON in the browser console (`[granttrail]` prefix) with cause, context and impact.
