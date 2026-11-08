# Auryn preprod enhancement report — November 8, 2026

## Scope and isolation

Baseline: remote `anudeepcare/nivora` preprod at `b050ff2f3d458973936f2c0e3f2951f07b13462a`, verified before edits and again before release. Work was isolated from the original clean checkout. Production/main was `d6b51bd222f6f3c9d88748398dd8b176b3d69ed0` and is outside this release. No database migration, security-setting change, data purchase, permanent access, broker order or private-holdings AI transmission was performed.

## Delivery status

ZIP-only delivery per the user’s final instruction. Local commit: `d0dc2bab6e9e8bdd17e75e1098480a9c36ea14e7`. A preprod push was attempted before the instruction changed, but failed because GitHub credentials were unavailable; no remote write occurred. Remote preprod and main were rechecked and remain at the hashes above. No preview deployment was created. Release automation is stopped. This report and README were then updated for ZIP delivery; product code is the verified local commit.

## Integration correction

The initial ZIP missed the active-screen wiring for CompanyMetrics and PositionExplorer. This corrected source connects both to IntegratedResearch, with on-demand position review and a retained full-metrics disclosure. See VISIBLE-CHANGES-20261108.md for the exact UI locations, deployment URL distinction, and honest scope of visible changes. The corrected product source includes these local changes beyond commit d0dc2ba; it is not yet deployed.

## Scenario follow-up

Two additional outlook blockers were corrected: missing vendor EV/revenue can be rebuilt only from corroborated financial/listing evidence, and fiscal-year-specific EPS eligibility no longer blocks a valid revenue range for the selected year. The archived IREN fixture still lacks dated share/listing evidence; no targets or analyst bounds were fabricated. Synthetic tests cover IREN/HIMS/CIFR/NBIS. Live current-provider validation remains blocked by preview authentication. See the visible-changes guide for details.

## Implemented

1. **Opening workspace:** one viewport launch composition across authentication, access and workspace, small animated Auryn mark, safe-area padding, light/dark and reduced-motion styles, a shared opening clock and actual slow/error recovery. Successful loading has no artificial delay. Access refresh retains mounted content until its authorization response; secondary Research/Portfolio/Watchlist chunks use local skeletons.
2. **Evidence correctness:** AI feature authorization now precedes cached-report return; explicit valuation multiples retain their correct attribution; selected settled-close freshness no longer inherits a discarded quote's stale flag. Shared earnings selection validates dates, excludes already-reported events and withholds schedules from datasets over 30 days old. EarningsReview, StockFacts, movement and decision snapshots use that rule. Price freshness shows intraday UTC time when appropriate; old datasets and dated ownership disclosures are distinguished from usable fresh evidence. The existing 550-day financial decision threshold was not changed. AI output validation additionally rejects Unicode numeric/currency characters; this is not a semantic truth guarantee.
3. **Pace and comparison:** the existing Strategy Lab now defaults to actual v6 technical rules, with explicitly selectable legacy v5 research. Accounts use equal cash, dates, prices and cost assumptions. P0/P1 retain cash; P2/P3/P4 use 1×/2×/4× regular contributions capped by cash. No pre-release history is relabeled. CSVs include policy, signal and execution dates. Existing prospective tooling now verifies v6 replay, policy version and dependency fingerprints. Existing monthly allocation cent-exact budget/cap behavior is preserved.
4. **Scenarios:** the existing funded model is reachable through the lazy Expectations workbench. Company annual/TTM starting values, filing/share dates and sources accompany explicit currency/ADR/share reconciliation. Bear/Base/Bull remain visible when incomplete. Funding, dilution and price-implied terminal EV/EBITDA sensitivities require explicit assumptions. Both operating modes exclude unsupported financial/insurance/specialized-financial/real-estate/crypto models. No probabilities or validated forecasts are implied. Formula documentation remains in the private owner handbook.
5. **Portfolio and thesis:** existing position exploration shows recorded-cash shortfalls or trim proceeds and investment-only concentration impact, separately from the business decision. Partial/stale pricing withholds funding feasibility. Candidate review preserves business rationale alongside size review. Earnings adds comparable filed annual revenue, margin, share-count and cash-flow-per-share changes with source links and conditional thesis prompts.
6. **Metrics and readability:** top metrics prioritize available per-share FCF, dilution, operating runway and appropriate specialist book-return measures. Valuation multiples carry uncertainty context and source links. Company metrics skip unused technical computations. Small Options/Research labels were raised to 12px; mobile Options inputs/selects use 16px. Existing lazy boundaries are preserved and funded scenarios load only when opened.

## Verification

- Clean baseline: 1,241 unit tests passed.
- Final corrected integrated unit suite: 1,280 passed, zero failed.
- Final lint and formatting passed; final typecheck passed.
- Final optimized build and complete controlled API suite passed. The production-isolation check verified all 56 server traces exclude development fixture source. Build reports 105kB shared first-load JS and 336kB for the catch-all app route; these are bundle outputs, not measured load times.
- Non-blocking existing diagnostics: test Link fixtures emit a React `scroll` attribute warning; Next notes the absent Next ESLint plugin. The explicit repository lint command passes.
- Regression tests reproduced the authorization, explicit-multiple and selected-price issues before fixes. Independent review found unsupported funded sectors and inconsistent earnings selection; both were reproduced, corrected and covered by regressions.
- Browser verification was attempted but blocked: local Chromium failed to create its required Unix socket (`Operation not permitted`); the cloud browser could not reach the isolated local server (`ERR_CONNECTION_REFUSED`). Existing render/interaction-harness tests passed, but they do not validate visual composition, CSS layout, actual browser interaction or physical iOS/PWA behavior.

## Performance evidence

`node --experimental-strip-types scripts/benchmark-company-metrics.mjs` is a reproducible synthetic warmed Node helper comparison, 100 alternating samples. This environment measured full overview median 0.647ms / p95 5.027ms and company-only median 0.142ms / p95 0.472ms. This measures the skipped computation path, not page-load speed, production telemetry, mobile browser or iPhone latency. No end-to-end speed improvement is claimed.

## Remaining limits and follow-up

- **Full v6 performance evidence remains unavailable.** The frozen model released November 7, 2026; no completed execution months qualify yet. The technical replay does not reconstruct historical business eligibility, valuation or portfolio gates. No superior returns, future accuracy or real prospective performance are claimed. Real dated observations must accumulate and be audited.
- **AI remains evidence-constrained, not truth-certified.** It receives server-loaded public evidence, never private holdings. Citation membership and numeric-character validation cannot prove a qualitative claim. Preview variable-name metadata showed market-provider credentials but no OpenAI key/model configuration; live AI behavior was not validated.
- **Provider entitlements are not established by credential presence.** Preview configuration metadata was checked without decrypting values. No paid-provider connectivity, subscription coverage or authenticated live-account test was performed.
- **Unsupported data stays unavailable.** No ETF look-through overlap, benchmark return attribution or invented event/revision history was added. Recorded cash is not broker buying power; taxes, fees, settlement and other commitments remain outside the hypothetical position review.
- **Scenarios require user assumptions.** No future growth, financing or dilution is silently supplied. These are sensitivities, not forecasts or probabilities.
- **UI acceptance remains outstanding.** Populated, missing-data and expanded layouts in real mobile/tablet/desktop browsers, theme review, slow-network interactions and physical iOS PWA verification must be completed on the preview before any later production release.
