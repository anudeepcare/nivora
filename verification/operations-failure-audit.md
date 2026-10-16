# Historical operations test audit

Read-only assessment of the 30 non-`auryn-v*` failures in `auryn/verification/logs/engine-tests-restored-workflows.log`. Approved redesign replaces legacy component/class/copy contracts. No test files were changed. Paths below are relative to `auryn/`.

## Real capability gaps

- **Trading Lab operational detail was lost in the redesign.** `app/api/trading-lab/status/route.ts:161–192` supplies runner result/code/latency, 20 recent runs, research decision distribution and blockers, learning state/reason, and realized performance metrics. `app/trading-lab/page.tsx` exposes the latest run and evaluation rows; Strategies has schedule, last automatic timestamp and matured count, but no runner health, prior run history, BUY distribution/closest candidates, learning reason, win rate or profit factor. A failed scheduler can therefore look like a merely quiet account. This is a real visibility regression behind v61-auto, v61-trading-ui, v642-audit, v65-trading-runs/consistency, v6510-audit, v654 and v655 failures. Restore in collapsible detail panels without resurrecting the old layout.
- **Stock overview price-level gating needs attention.** `components/StockClient.tsx:546–578` builds `canonicalValidationLevels` from raw `d.marketIntelligence.actionMap`, with `d.levels` fallback even when the plan is not READY. The overview at line 902 receives `v5ChartLevels??canonicalValidationLevels` without a `priceSensitiveAllowed` / `canonicalTrustBlocked` guard. `components/premium/AurynResearchOverviewV2.tsx:63` consumes those levels directly. The technical tab also mounts raw `MarketActionMap` at line 921. Thus v42 tests are source-stale but their safety intent cannot all be dismissed. Root notified for stock-scope confirmation/fix.
- **Unused CSS remains:** `tests/v65-css-cleanup.test.mjs` genuinely detects obsolete selectors in `app/globals.css`; examples include `.v12Fund`, `.v32Institutional`, `.v34InstitutionsPage`. This is maintenance/bundle debt, not a missing user capability or an engine failure. No CSS removal recommended during this urgent pass.

## Obsolete test contracts / capabilities preserved

| Failing tests | Assessment and current evidence |
|---|---|
| v61-trading-lab-operational-console | `RECENT DECISIONS` and `Risk / Order` copy changed. Current Trade history renders decisions, execution reason, risk code, order/fill state, quote provider/age and canonical IDs in `app/trading-lab/page.tsx`. Backend persistence/audit assertions pass before the obsolete UI literal. |
| v62-calibration-page; v64-ui-contract | `app/calibration/page.tsx` shows Brier / ECE and exact-engine vs weight-compatible cohorts, blanks for no measured outcomes, and “Waiting for measured outcomes.” Exact capitalization/expanded acronym/old empty-state copy failures. No lost core evidence metric found. |
| v65-ui-consistency portfolio; v6514-master-portfolio; v6515-portfolio-master | `HoldingsIntelligence` component removed. Current `app/portfolio/page.tsx:12–35` supports EQUITY, CRYPTO, CASH and one holdings collection with quantities, edit and remove. “Qty only” is obsolete wording contract. |
| v6510-action-toolbar (2) | `.v6510ActionToolbar` was replaced. `StockClient.tsx:352` watch persistence is passed as `onAddWatchlist={watch}`; overview toolbar calls it and `onTrackPosition` routes to `/portfolio?symbol=`. Current portfolio pre-fills that symbol. |
| v6512-snapshot-lifecycle | Exact double-quoted `method:"POST"`, `setPulseHistory` and `refreshPulseHistory` names changed. `app/portfolio/page.tsx:24` POSTs the balance then awaits `load()`, which GETs pulse history and calls `setHistory` at line 15. Capability preserved. |
| v6518-wow-ux-performance Analyze; v60-live-api stock refresh | 20-second polling became 30 seconds. `StockClient.tsx:204–214` independently refreshes research display and canonical snapshot; visibility guard remains. This is slower polling, aligned with performance intent. |
| v6518-wow-ux-performance Trading Lab | Exact callback/quote style regex stale. Current page polls every 30 seconds only while `document.visibilityState==='visible'` and clears timer. |
| v6519-mobile-product-ux alerts | Delete moved to `components/portfolio/TrackedList.tsx:13,19`; remove action persists database deletion and updates list. `app/alerts/page.tsx` composes that component. |
| v653-ux-trading endpoint | Authentication moved to `lib/server/authorization.ts`, which validates bearer token with `auth.getUser(token)` and admin authorization. `app/api/trading-lab/run-now/route.ts:7–16` uses helper, refreshes learning and runs paper route. UI “Run paper check” remains wired. |
| v654-premium-ux portfolio | `showAdd` renamed to `form`; “Add investment” opens form, and empty portfolio shows onboarding rather than empty priority cards. |
| v655-decision-ux auth | Old tagline “Know what to do next” replaced by approved redesign copy. No auth behavior asserted by this failing check. |
| v42 quote route; v60 live quote route | `/api/quote` is now deliberately the fast research-display route, returns `researchOnly:true, executionVerified:false` via `lib/auryn/fast-quote.ts`; canonical execution market data remains separately loaded. Old requirement that this particular route import the gateway/no-cache is no longer architecture truth. See separate gating finding above. |
| v42 technical/near-term UI tests | Legacy text/component `StockDecisionSummary.tsx` removed. Technical chart itself gates levels with `priceSensitiveAllowed`, options gating and snapshot persistence gating remain. The unguarded alternate map/overview path is the separate real finding above. |

## Scope and verification

This audit traced source and failing assertions. It did not rerun full engine tests or make deployment/network requests. Root's existing current release gate and build remain the relevant functional baseline; historical regex failures are not a reason to restore obsolete UI.

## Authorized follow-up implementation

At root's request, restored the missing Trading Lab visibility in `app/trading-lab/page.tsx` only. Native keyboard-accessible disclosures appear under Paper check and Trade history for automatic-runner health, recent manual/automatic cycles, stored BUY distribution and blockers/closest candidates, learning state/reason, and realized performance. Existing classes, manual order flow, errors and admin flow remain. Missing values are explicit; performance rates stay unmeasured until completed trades exist. No API, CSS or test files changed.

Verified the complete page with TypeScript TSX transpilation diagnostics, then server-rendered the new disclosures against empty, populated and migration-required fixtures. Confirmed five disclosures, unknown/empty states, runner failure code, cycle error, blocker details, candidate link, learning status and measured win-rate/profit-factor output. All checks passed. No Next build launched, to avoid root's concurrent build.

Root follow-up: Trading Lab operational disclosures and blocked-price/trust rendering guards are now implemented. Legacy globals.css is retained but not imported by the new root layout; its old-selector failures concern retained source, not the active styling bundle.
