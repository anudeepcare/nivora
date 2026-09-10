# AURYN V9.3.2 — Unified Mobile-First Institutional UX

## Milestone
Every stock surface presents one synchronized institutional research story driven by the existing V9.3.1 canonical decision and Market Truth contracts.

## What changed
- Rebuilt the institutional call from a gray KPI dashboard into an editorial decision hero.
- Replaced six large pillar cards with ranked decision-driver rows.
- Replaced the Evidence Quality banner with compact, explicitly uncalibrated evidence metadata.
- Kept New Money, Owner, Long Term and Execution in one compact action strip.
- Added a cleaner Why / Counter-Evidence / What Changed / Next Trigger / Invalidation narrative flow.
- Reworked the stock masthead for canonical 24/7 price + market state without a detached status strip.
- Evidence tabs no longer repeat a separate AURYN verdict.
- Evidence navigation is sticky and horizontally scrollable on mobile.
- Canonical Setup Map remains available in Technicals as collapsed supporting evidence, not a competing hero.
- Legacy V5 decision/plan/scenario diagnostics remain collapsed under Extreme Pro.
- Astra review is available in Pro and Extreme Pro but remains grounded and non-authoritative.
- Added VS Code tasks and CLI aliases for quick reliability, full release gate, and 30/100/500-symbol live audits.

## Local commands
- `npm run verify:quick`
- `npm run verify:release`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:30`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:100`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:500`

In VS Code use **Terminal → Run Task…** and select the matching AURYN task.

## Verification status before packaging
- V9.3.2 UX contract: 10/10 PASS
- V9.3.1 focused contract: 29/29 PASS
- V9.3.1 Reliability Lab: PASS
- Full AURYN regression: 652/652 PASS
- V8 Reality Audit: 100/100 PASS
- V9.2 core: 44/44 PASS
- V9.3 core: 27/27 PASS
- V65 dead-code audit: PASS

## Production build status
The sandbox did not have Next.js dependencies installed. `npm run build` returned `next: not found`, and `npm ci` hit a transport timeout. Therefore this package is not labeled production-build-verified until Vercel completes `next build` successfully.
