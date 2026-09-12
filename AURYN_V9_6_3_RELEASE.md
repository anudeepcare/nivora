# AURYN V9.6.3 — Quality + CIO Engine Audit

## Product quality
- Fixes the installed-iPhone PWA top safe-area ownership at the cascade source: the transparent iOS status area now inherits the active theme chrome instead of the page canvas.
- Keeps the app shell on the normal theme page canvas below the header.
- Improves the mobile stock masthead without changing its approved information architecture: identity/price columns are collision-safe and market-state metadata can wrap instead of truncating into broken ellipses.
- Makes evidence-tab overflow intentional with horizontal snap, scroll padding and a subtle edge fade.
- Restores the approved desktop typography baseline. Compact/Large personalization no longer globally shrinks or enlarges primary product copy; it is scoped to supporting text and footer/helper content.
- Does not change the approved bottom dock, Overview hero, chart geometry, theme names or layout.

## CIO engine audit infrastructure
V9.6.3 does **not** loosen production BUY/WAIT/AVOID thresholds. It adds deterministic diagnostics so V9.7 calibration can be evidence-led rather than quota-led.

The audit reports:
- New-money, owner and long-term decision distributions.
- Opportunity, entry-quality, evidence-quality and decision-score histograms.
- Dominant hard vetoes and policy blockers.
- Closest WAIT-to-upgrade cases and distance-to-BUY diagnostics.
- Contradictions such as ATTRACTIVE + AVOID, high-evidence AVOID and strong-opportunity WAIT.
- Bear/base/bull geometry validity.
- Base-case proximity to spot within ±2%, ±5% and ±10%.
- Scenario spread medians and an anchoring diagnostic.
- Decision concentration diagnostic without prescribing a target BUY percentage.
- SHA-256 fingerprint of canonical audit metrics for deterministic release comparisons.

## Commands
```bash
npm run audit:v963-decisions -- --input decision-audit-input.json --output decision-scenario-audit.json
npm run test:v963
npm run gate:v963
```

## Locked
Market Truth, provider selection, production decision thresholds, score weights, canonical action policy, scenario generation, portfolio calculations and price levels are unchanged by this release.
