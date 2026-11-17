# Enterprise acceptance candidate — 27 October 2026

## Changes implemented

Alert checks now persist an account-scoped continuation key when more than twelve rules are enabled. Each bounded run advances through stable key ordering and wraps after the final rule. The continuation is saved immediately before each individual rule attempt so a request terminated during provider work resumes its unattempted tail. Failed rules are eligible again on the next rotation. Concurrent runs can overlap; event persistence still uses the existing unique key to prevent duplicate events. This is eventual batch coverage, not an exactly-once job queue.

The API reports total enabled rules, batch size and rules outside that batch. The Alerts page shows checked versus total and prompts continuation. A truncated rule response or failed continuation read/write now fails visibly before claiming coverage. Missing dated financial inputs generate an explicit evaluation warning. P0–P4 notification titles replace purchase-multiple wording and require business/risk review before buying.

Reserved internal records are excluded from public document queries before their limit, and cannot be replaced/deleted through public document actions.

No SQL migration, new dependency or change to Pace price thresholds is introduced. Continuation uses the existing private account-document store and existing RLS. The scheduled route retains its operator-configured owner boundary; this update does not enable scheduled monitoring for every subscriber automatically.

## Regression evidence

- Twenty-six enabled rules are reached over three twelve-rule batches; the saved state survives separate calls.
- Truncated account rule lists and continuation-store failures reject the check before provider work.
- Missing financial inputs produce an evaluation warning rather than silent success.
- All five Pace notification levels use zone terminology.
- Real local Postgres migration tests confirm continuation roundtrip and cross-account denial.
- A dated Microsoft FY2025 income reference retains USD units and a roughly 45.62% operating margin, using revenue $281,724 million and operating income $128,528 million. Source: https://www.microsoft.com/investor/reports/ar25/ . This is a historical calculation reference, not verification of current live app figures.

## Acceptance gates

| Gate | Status | Basis |
|---|---|---|
| Shared Pace rules and confirmed/forming separation | Passed locally | Existing contract tests retained; no threshold retuning |
| Alert batch continuation and wording | Passed locally | New behavior and failure-path tests |
| Account isolation | Passed locally | Existing migrations executed in Postgres test runtime |
| Metric normalization | Passed locally | Currency, annual/TTM, units, conflicts, missing values, dated capitalization and source provenance tests |
| Responsive interface | Prior recorded checks retained | See pace-zone validation screenshots and report; this pass changes alert status wording, not layout |
| Independent live metric reconciliation | Blocked | Connected financial-statement endpoint denied entitlement; production feed is not accessible for comparison here |
| Deployed authenticated flow and operating performance | Blocked | Connected Vercel account returned no matching Auryn project; correct hosting-team access is required |
| Automatic monitoring for every subscriber | Not implemented | Scheduled job deliberately targets an explicitly configured operator account; manual checks are account-scoped |
| Investment outperformance | Unestablished | Prior price-only historical research does not validate the full decision strategy |

This candidate must not be described as having full production enterprise acceptance. Remaining gates need production-host access, entitled current financial inputs reconciled with dated issuer reports, authenticated desktop/mobile journeys, and a separately verified subscriber-wide scheduling design if automatic monitoring is part of the product promise. No live trade, payment, email or production deployment was executed.

## Reproduce local release gates

Run `npm ci`, then `npm run test:acceptance` in the extracted AURYN directory. This executes the full test suite, TypeScript, production build and controlled API tests. Passing this command does not certify production credentials, live data rights, all device behavior or investing performance.

## Final review disposition

One fresh read-only review found two Important issues and no Critical issues. Both were fixed with regressions observed failing first: (1) checkpointing an entire batch could skip unattempted rules after request termination, now checkpointed per rule; (2) continuation records could appear in saved screens, now filtered before the document query limit, with reserved-key mutations rejected. Concurrent invocations may overlap and retry; existing event uniqueness prevents duplicate stored events. There is no exactly-once execution claim. The total outside the current batch is a batch-coverage count, not a completed-sweep counter.

The scheduled account boundary remains deliberately restricted to the configured operator. Independent live financial-feed access and the production hosting team remain external acceptance gates. Local database tests verify the private continuation state, but do not substitute for deployed RLS inspection.

Final local validation: 838/838 tests, TypeScript, optimized production build and all nine controlled API scripts passed. Logs are in `enterprise-validation/`. The connected hosting account also returned an empty team list. No production change was performed.
# Enterprise valuation foundation — 28 October 2026

The approved build now includes a budget-first, shadow-only valuation engine. It stores append-only point-in-time observations, reconciles shares/price/market cap and corporate actions, routes instruments and business shapes to guarded methods, applies duration-aware rates and precise dilution waterfalls where terms are supplied, and refuses unsupported valuation rather than fabricating a target. Bear/base/bull cases are deterministic sensitivities; Monte Carlo, options IV, alternative data and transcript extraction remain feature-gated until their data and performance are measured.

P0–P4 Pace remains a separate confirmed price-zone signal. The valuation engine cannot turn P1 into Buy, cannot overwrite Pace, and cannot alter the visible production decision because it is connected through `compareShadow` only. Every candidate output includes a trace ID, model version, config hash, source lineage, assumptions, flags and refusal reason. Governance tables are append-only; overrides require a separate proposal/approval record.

## Current local evidence

| Gate | Status | Evidence |
|---|---|---|
| JavaScript regression | Passed locally | 857 tests passed |
| Python valuation engine | Passed locally | 38 tests passed |
| Database governance | Passed locally | PGlite append-only/RLS migration checks passed |
| TypeScript/route typecheck | Passed locally | `npm run typecheck` |
| Optimized production build | Passed locally | `npm run build` |
| Controlled API suites | Passed locally | `npm run test:api` completed; synthetic transport where labelled |
| Browser interaction runner | Blocked in this workspace | Playwright package is available, but its Chromium executable is not installed; no new browser binary was downloaded |
| Live-provider reconciliation | External gate | Entitled current financial feeds and issuer reconciliation require production credentials |
| Deployed authenticated/device acceptance | External gate | No deployment, physical device, or live account mutation was performed |
| Forecast/investment performance | Unestablished | Integrity tests do not prove market outperformance |

This is an enterprise-grade local engineering foundation, not a production certification or a claim of 99.9999% forecast accuracy. Before promotion, run the browser/device, live-data, security, model-risk and compliance gates in the target environment.

