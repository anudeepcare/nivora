# AURYN V9.3.3 — Core UX

## Milestone
One clear stock-research surface: decision, actionable levels, reasons, risks, and research tabs without dashboard clutter or essential expanders.

## What changed
- Removed `EXECUTION BLOCKED` from the stock research hero. Execution safety remains enforced in the engine and Trading Lab.
- Removed the Astra panel from the stock experience. AURYN has no AI-runtime dependency for core research and does not require an OpenAI API key.
- Added always-visible Preferred Entry, Confirm, Support, T1, T2, and Risk levels sourced from the canonical V5 execution plan / technical snapshot.
- Reduced the canonical call to New Money, Owner, and Long Term actions.
- Replaced ranked influence dashboards and global evidence expanders with a compact `Why this call / What upgrades it / What breaks it` research story.
- Removed the mobile `More` expander from stock tabs; all evidence tabs use one horizontally scrollable navigation.
- Technical setup map is directly visible in compact form, with the canonical price-structure chart directly below the technical evidence.
- Removed the primary stock metric-dump expander; deep evidence remains organized in its natural research tabs.
- Reduced border/grid chrome across Thesis, Business, Earnings, and Technicals to keep the page editorial rather than dashboard-like.

## Safety boundaries preserved
- 24/7 Market Truth behavior is unchanged.
- DecisionSnapshot and canonical-decision reuse are unchanged.
- Trading Lab fail-closed execution rules are unchanged.
- V9.2 point-in-time historical integrity and V9.3 feature-tournament gates are unchanged.
- Astra adapter code remains isolated/optional for future use but is not invoked by the stock UX.

## Automated acceptance
- `npm run test:v933`
- `npm run test:v932`
- `npm run test:v931-core`
- `npm test`
- `npm run audit:v931-reliability`
- `npm run audit:v8-reality`
- `npm run test:v92-core`
- `npm run test:v93-core`
- `npm run audit:v65`

The local Next.js production build still depends on installing npm dependencies. If the build environment cannot reach the package registry, Vercel remains the production compiler gate.
