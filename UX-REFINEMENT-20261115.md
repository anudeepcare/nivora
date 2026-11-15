# AURYN UX and loading refinement, November 15, 2026

## Status and scope

This is a locally verified source candidate built on the November 14 system-audit handoff. It is not deployed and is not production-accepted. It addresses the eight supplied screenshots with focused composition and labeling changes, rather than replacing working research calculations.

The earlier system-audit fixes remain included. Source selection, the restricted SentiSense preview integration, decision inputs, Pace policy/classifiers, valuation calculations, data budgets and production settings are unchanged. A close numerical match to another product does not identify a common upstream provider or establish broad parity.

## Screen changes

- **Home:** Companies now precede the optional contribution comparison. The oversized comparison promotion becomes a compact tool row with the same controls. Earnings/events and news share one coordinated desktop grid and stack on smaller screens. Holdings, coverage, company cards, updates, comparison, plan link and Pace review remain available.
- **Research Overview:** The eight-cell company metrics and four research-category grids are visible without opening a disclosure. Their individual metric help is untouched. Pace remains beside the real chart on desktop, with a logical one-column fallback. The concise read, complete range and risks stay visible. Secondary coverage, methodology and deeper evidence share one lazily rendered “Sources & methods” disclosure. Optional content no longer reserves empty named grid rows.
- **Research Valuation:** A complete selected analyst low/consensus/high range is displayed once, not repeated beside itself under bear/base/bull names. It retains provider, dataset date, analyst count when supplied, comparison price/date/basis and the caveat that individual revision dates and forecast horizon are not supplied. A valid consensus-only observation still appears when bounds are missing. Modeled bear/base/bull cases and all methods/calculators remain separate and available.
- **Research Targets:** Conditional valuation has source-specific headings. Controls no longer call every default output a three-year result; the scenario retains its actual dated end. Historical price risk remains available without a second redundant heading. Editable multiple and all three supported case values remain intact.
- **Portfolio:** The snapshot is a lighter summary row with every value and explanation retained. The selected comparison benchmark is queued before uncached holding histories; existing partial charts, coverage, retry and auth/rate-limit stop behavior remain. This does not guarantee unavailable benchmark history.
- **Public entry:** The illustrative Pace guide loads its existing interactive component when selected instead of pulling both frozen models into the shared entry bundle.

## Verification performed

- Final `NEXT_TELEMETRY_DISABLED=1 npm run verify`: exit 0. Lint, format check, **1,492/1,492 tests**, typecheck and production build passed on the combined candidate.
- Final `NEXT_TELEMETRY_DISABLED=1 npm run test:api`: exit 0. Controlled fixture transport only, including private-target preview isolation and 56 production file traces. No live payment or provider purchase.
- New regressions were demonstrated failing before the relevant correction. They cover metric visibility rather than hidden server markup, complete-range deduplication, analyst labels/provenance, retained consensus-only data, actual conditional headings, Home ordering, compact snapshot content, empty optional rows, public lazy import and benchmark scheduling.
- Independent source review checked metrics, metadata, responsive rules, partial-data behavior and the source/type-only `stock-pillars` change. The review's provenance and empty-grid findings were corrected and rechecked.
- The generated policy fingerprint is byte-identical to the preceding system-audit candidate. No API, provider adapter, classifier or migration file changed in this refinement.
- Next retains its existing ESLint-plugin configuration warning. It did not fail lint or build.

Measured final build payload and limitations are in `verification/loading-refinement-20261115/PERFORMANCE.md`. The common entry JavaScript is about 66% smaller after gzip. **This is not a 66% faster application or a 66% smaller complete route:** Home and Portfolio still load engine code in their later workspace chunks. Browser timing and actual user-perceived speed have not been measured.

## Open acceptance gates

1. **After-change browser and device QA remains blocked.** An isolated copy of this candidate started a local development preview on port 3276. Cloud-browser navigation to `http://terminal.local:3276/preview/research/MSFT` returned `net::ERR_BLOCKED_BY_CLIENT`; a separate shell loopback request returned connection refused despite the server's ready output. No tunnel or deployment was used to bypass the restriction. Preproduction and supplied screenshots were inspected before these changes, not as proof of the candidate's rendering.
2. Before deployment, inspect actual populated and missing-data Home, Overview, Valuation, Targets and Portfolio at desktop, tablet and phone sizes. Check chart/decision alignment, first-visit empty change history, expanded sources/methods, metric help, complete/equal/missing analyst bounds, conditional scenario controls, benchmark failure/retry and keyboard navigation. Review the other Research tabs for visual regressions from shared StockPillars/QuickRead components. Source and render tests do not certify aesthetics or overlap-free rendering.
3. Current-company end-to-end financial/estimate/history validation, source/reference parity and forecast usefulness remain separate open gates inherited from `SYSTEM-AUDIT-20261114.md`. No missing financial inputs were fabricated and no investment performance claim is made.

## Run locally

Use Node 24.x and the lockfile: `npm ci`, then `NEXT_TELEMETRY_DISABLED=1 npm run verify` and `npm run test:api`. A local fixture preview uses `AURYN_ENABLE_PREVIEW=true npm run dev` and `/preview/research/MSFT`; it is development-only and restricted to loopback/terminal.local. Fixture data is not live evidence.

The ZIP has `package.json` at its root and excludes dependencies, build outputs, environment/credential files, transient logs and browser captures. `MANIFEST.sha256` covers every packaged file except itself. No code was pushed or deployed and no service was purchased.
