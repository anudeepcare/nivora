# AURYN V9.3.2 — One-View Premium Institutional UX

## Milestone
Every stock surface presents one synchronized, mobile-first institutional research experience driven by the V9.3.1 canonical decision and 24/7 Market Truth contracts, with one expert view instead of Beginner / Pro / Extreme Pro modes.

## What changed
- Rebuilt the canonical AURYN call in the dark premium editorial style preferred from the earlier AURYN decision surface.
- Removed Beginner / Pro / Extreme Pro selectors from the stock experience. There is one expert-quality view for everyone.
- Removed the duplicate legacy V5/V8 black decision hero so the app publishes one canonical call only.
- Kept New Money, Owner, Long Term and Execution in one compact action strip.
- Shows the top three decision forces first; all six pillars and model attribution remain available under a single clean **Full evidence & model trace** disclosure.
- Preserved explicit Evidence Quality wording as uncalibrated and **not a probability of profit**.
- Preserved Why This Call, strongest counter-evidence, What Changed, next decision trigger and invalidation/risk.
- Thesis no longer publishes a competing second AURYN decision.
- Technicals keeps the canonical Setup Map and advanced metrics only as collapsed supporting evidence, so setup detail cannot compete with the primary call.
- Removed obsolete independent technical/confluence fallback panels and orphaned CSS.
- Astra remains grounded and non-authoritative, and raw credential/configuration names are never rendered to end users when the analyst service is unavailable.
- Mobile keeps the same hierarchy as desktop: single-column narrative/evidence, compact action layout, horizontally scrollable sticky tabs, no 375px horizontal overflow.
- Existing V9.3.1 DecisionSnapshot, Market Truth, Trading Lab fail-closed behavior, feature tournament, historical-data gates and execution safety are unchanged.

## Developer workflow
- `npm run verify:quick`
- `npm run verify:release`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:30`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:100`
- `AURYN_BASE_URL=https://getauryn.vercel.app npm run audit:live:500`

In VS Code use **Terminal → Run Task…** and select the matching AURYN task.

## Acceptance contract
- Exactly one canonical institutional decision surface.
- No Beginner / Pro / Extreme Pro stock-depth controls.
- No duplicate legacy decision hero.
- Top decision forces visible before lower-value diagnostics.
- Full expert evidence remains available on demand.
- Evidence tabs explain the same canonical decision rather than creating new verdicts.
- Canonical Technical Setup Map is supporting evidence only.
- Astra cannot expose raw secrets/configuration errors or override deterministic AURYN authority.
- 375px mobile layout must not horizontally overflow.

## Production build status
A local Next.js production build cannot be claimed from this sandbox because Next.js dependencies are not installed and the package transport repeatedly timed out. Vercel must complete `next build` successfully before this exact release is labeled production-build-verified.
