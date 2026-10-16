# AURYN — Next Build Approval Scope

**Revision:** 1  
**Prepared:** October 16, 2026, America/Chicago  
**Status:** Proposed; awaiting Anudeep's approval. No implementation or trading changes authorized by this document alone.

## Product goal and approval boundary

Build a dependable investment research and portfolio platform that helps people understand the business, judge valuation, assess entry conditions, plan exposure and review outcomes. Serve new, regular and advanced investors through one consistent analytical system with different presentation depths.

Retain the currently approved premium mobile-first AURYN experience and extend it coherently to desktop. Earlier legacy mockups or documents must not override the user's latest approved design. Preserve working features and integrations. This scope adds the engine and product capabilities discussed on October 16 and makes earlier unresolved requirements explicit.

Approval of this document authorizes implementation and testing of all included sections as one release. The implementation checklist will use the IDs below. Conditional and deferred capabilities are explicitly identified in section 15; they must not be silently presented as completed. No paid subscription, unapproved paid service, real-money trading or fabricated live verification is included.

## 1. Baseline, route inventory and preservation

- A01: Establish the latest GitHub source as the baseline; reconcile surviving local fixes and previous release artifacts before changing files.
- A02: Inventory all routes, API contracts, database migrations, background jobs, environment-variable names and interactive controls. Preserve existing user data, investment histories and valid engine contracts.
- A03: Map the latest approved screens to routes and distinguish approved mockups from screenshots documenting defects.
- A04: Track each item below as implemented, verified or blocked, with evidence. Internal development phases do not become partial release ZIPs.

**Acceptance:** A route/action matrix and requirement-to-test checklist account for every included item. Missing references or inaccessible services are disclosed before claiming fidelity or live verification.

## 2. One canonical decision with independent dimensions

- B01: Keep business/thesis, valuation, tactical timing, portfolio fit, evidence quality and execution permission separate.
- B02: Return distinct assessments for new capital, existing owners and long-term research. Assess tactical/swing, six-to-twelve-month and three-to-five-year horizons with horizon-appropriate evidence rather than copying one result.
- B03: A chart break can invalidate a trading setup or pause a timing strategy; it must not by itself establish a broken business thesis. Fundamental deterioration requires named evidence.
- B04: Preserve a rule-based ability to withhold action when evidence is insufficient. Do not turn missing inputs into zero, a bearish opinion or a fabricated neutral fact.
- B05: Distinguish evidence coverage, investment attractiveness and calibrated outcome probability. Do not label an uncalibrated score as win probability.
- B06: Avoid double-counting correlated indicators or repackaged evidence. Document factor families, weighting, policy thresholds and override reasons.
- B07: Use the same versioned snapshot across overview, research tabs, watchlist, portfolio, alerts and paper execution. Show price-only updates separately from research updates.
- B08: Explain the leading positive evidence, counterevidence, changes since the previous snapshot and the next upgrade/downgrade conditions.

**Acceptance:** Price-only changes do not silently rewrite business quality; technical failure is distinguishable from thesis failure; the same snapshot produces consistent decisions everywhere; no forced BUY quotas.

## 3. Financial data, source integrity and market freshness

- C01: Normalize quarterly, year-to-date, annual and trailing-period financials; preserve currency, units, fiscal periods, filing/publication dates, restatements and share-count changes.
- C02: Attach provenance, calculation basis, observation time and availability reasons to material metrics. Distinguish reported facts, management guidance, external estimates and AURYN assumptions.
- C03: Repair missing-value paths end to end: provider response, normalization, calculation, persistence and rendering. Never fill gaps with invented prices or fundamentals.
- C04: Distinguish regular, premarket, after-hours, delayed, stale and unavailable quotes, with actual as-of time and provider. Keep stock and crypto session/history behavior appropriate to the asset.
- C05: Deduplicate provider requests, cache shareable data, refresh filings on relevant updates and preserve interactive headroom. Retain the documented 55/min ceiling and 42/min background cap unless verified configuration requires a stricter limit.
- C06: Handle rate limits, outages, unavailable entitlements and conflicts between sources with explicit states and bounded retries.
- C07: Use existing authorized providers first: Twelve Data, SEC, Finnhub, Alpaca and other providers actually configured in the current application. Verify each provider's usable capability rather than assuming a subscription includes it.

**Acceptance:** Every material missing or stale value has a specific reason; no stale quote carries a LIVE label; known financial-period and corporate-action cases calculate correctly.

## 4. Business models, moat and long-term thesis

- D01: Maintain an explicit business-model and lifecycle coverage registry. Evaluate mature compounders, growth businesses, capital-intensive infrastructure and frontier/pre-scale businesses with suitable dimensions.
- D02: For IREN-type infrastructure, evaluate segment economics, contracted versus operational capacity, power, utilization, delivery, equipment economics, customers, capex, financing, dilution and remaining mining exposure where applicable.
- D03: For ASTS-type satellite businesses, evaluate deployment milestones, usable capacity, commercial conversion, regulatory dependencies, financing, runway and dilution. Management targets remain distinct from delivered results.
- D04: Build source-backed moat evidence around factors relevant to the business: cost advantage, switching costs, network effects, intellectual property, permits/spectrum, distribution or scarce assets. Label proxies and unsupported claims.
- D05: Maintain a living thesis containing reasons to own, counterarguments, milestones, material dependencies and business-specific invalidation conditions.
- D06: Track guidance versus actual outcomes and management execution over time; preserve what was known at each point.
- D07: Keep qualitative interpretation grounded in citations. A compelling growth story must not automatically produce a favorable rating.

**Acceptance:** IREN and ASTS receive traceable business-specific treatment, without hand-tuned BUY overrides. Other assets receive the correct supported model or a clear coverage limitation.

## 5. Valuation and implied expectations

- E01: Complete source-backed valuation inputs and meaningful independent cross-checks; do not merely remove the current gate that suppresses unsupported fair values.
- E02: Apply the implemented method appropriate to the business, with a coverage registry for unsupported cases. Preserve existing valid specialized methods; never apply a generic DCF indiscriminately.
- E03: Produce bear/base/bull estimates where evidence supports them, with growth, margins/cash flow, capex, discount rates, financing, net debt and dilution assumptions appropriate to the model.
- E04: Derive fundamental value from those assumptions. Compare it with market price afterward; never manufacture fundamental fair value from a technical level or a fixed markup on spot.
- E05: Add implied-expectations analysis for supported models: what operating outcomes the current price implies under the displayed assumptions.
- E06: Support editable scenario exploration and sensitivity analysis, keeping personal scenarios separate from the canonical assessment.
- E07: Show uncertainty, missing inputs and expected-return horizons. Do not publish invented scenario probabilities or unsupported peer comparisons.

**Acceptance:** Results reconcile to visible assumptions, react correctly to sensitivities and remain unavailable when critical inputs cannot be supported.

## 6. Technical structure, Fibonacci and chart behavior

- F01: Display retracements in decimal and percentage form: 0.236, 0.382, 0.500, 0.618 and 0.786; include anchor endpoints and supported extensions such as 1.272 and 1.618.
- F02: Permit a custom 0.686 level if selected, explicitly labeled custom. Keep 0.500 identified as a common retracement convention.
- F03: Show swing anchors, dates, timeframe, confirmation rules and whether the latest bar is completed. Provide reproducible automatic anchors and a clearly separated user-defined overlay.
- F04: Present potential support/resistance, reclaim conditions, confluence and setup invalidation without implying guaranteed reversals or price destinations. Distinguish moving-average period and type, including 50-week and 200-week studies when sufficient history exists.
- F05: Explain missing 15-minute/hourly studies, unavailable history and intentionally withheld action levels separately.
- F06: Define AURYN's own explainable setup markers, including diamond-style markers if useful. Publish exact conditions, first-known signal time and invalidation; prevent future-data leakage or retroactive signal claims.
- F07: Preserve working 1D/1W and longer ranges, readable dates, explicit zoom controls and normal page scrolling. Fix overlap, spacing and touch interactions across stock and crypto charts.
- F08: Keep technical setup interpretation visibly separate from long-term business and valuation assessments.

**Acceptance:** Fixtures reproduce levels from displayed anchors; historical replay uses only then-available bars; mobile chart gestures do not trap page scrolling.

## 7. DCA and accumulation planning

- G01: Define 1x as a user's planned contribution. Offer research policies for pause, reduced contribution, 1x, 2x and up to 4x, subject to explicit budget, cash and exposure caps.
- G02: Explain the evidence behind a proposed multiplier: valuation support, thesis status, concentration, funding risk and selected strategy. A declining price alone is insufficient.
- G03: Separate recurring accumulation from tactical entries; chart weakness can affect a tactical policy without automatically breaking a long-term thesis.
- G04: Let users set cadence, amount, allocation limits, review date and pause conditions, with preview and paper execution where supported.
- G05: Compare each policy with fixed DCA under identical cash budgets and contribution availability. Account for idle cash, costs, drawdown and turnover.
- G06: Label unvalidated multipliers experimental. A multiplier is an allocation instruction, never leverage or a promised return.

**Acceptance:** No plan exceeds cash or allocation limits; policy explanations are reproducible; performance reports cannot win merely by assuming more capital.

## 8. Portfolio intelligence and decision journal

- H01: Validate holdings CRUD/import paths already supported, prices, cost basis, cash, totals, realized/unrealized results and corporate-action handling. Every holding opens its research page; use real logos where available and consistent fallbacks.
- H02: Show asset, sector, theme and shared-risk concentration, with supported overlap/correlation analysis and coverage limitations.
- H03: Preview the before/after effect of a proposed purchase or paper plan on cash, position size and exposure limits.
- H04: Provide assumption-based portfolio stress scenarios and appropriate benchmark comparisons. Distinguish investment performance from deposits and withdrawals.
- H05: Save original thesis, evidence snapshot, intended horizon and plan at decision time; review subsequent outcomes without rewriting history.
- H06: Separate decision-process quality from a profitable or unprofitable outcome.

**Acceptance:** Portfolio arithmetic reconciles; proposal previews do not silently place orders; historical records are attributable and replayable.

## 9. Institutions, insiders, catalysts and evidence

- I01: Display institutional ownership changes using available source-backed filings, with holding period and filing date. Do not describe delayed disclosures as live whale activity.
- I02: Distinguish insider purchases/sales, grants, exercises and other transaction types where source data supports classification; avoid automatically treating all insider activity as conviction.
- I03: Build a catalyst and milestone timeline with confirmed versus estimated dates and delivered versus planned states.
- I04: Provide an earnings/milestone review comparing previous expectations with results and showing which thesis or valuation assumptions changed.
- I05: Handle contradictory evidence explicitly, preserving source dates and interpretation rather than averaging incompatible facts.

**Acceptance:** Every positioning or catalyst claim has supporting evidence; unavailable datasets remain unavailable.

## 10. Trading Lab, administrator access and paper operations

- J01: Diagnose the actual deployed admin mapping and establish the intended owner's trusted authorization using the authenticated identity. Preserve server-side enforcement and Supabase row-level isolation.
- J02: Check the paper runner's schedule, production URL, matching secret, enabled flags, service-role configuration, database schema, account capability and market-session eligibility.
- J03: Preserve required GitHub workflows and audit migrations. Never expose secret values in reports, logs or the ZIP.
- J04: Show separate status for authentication, admin permission, data readiness, strategy eligibility, scheduling and broker execution.
- J05: Display evaluation through submission, acknowledgment, fills, rejection/cancellation and reconciliation, with specific reasons for skipped or blocked runs.
- J06: Implement or verify order idempotency, duplicate prevention, position/cash limits, stale-data rejection, concurrent-run protection, pause control and bounded recovery.
- J07: Use canonical eligible decisions only. Record the exact evidence, policy and model used for each order.
- J08: Verify authorized paper order lifecycle in a controlled manner when credentials and session permit; report unverified steps individually. Keep paper clearly labeled throughout.

**Acceptance:** The legitimate admin can access the lab; every run is observable; retries cannot create duplicate intended orders; execution respects configured limits. No real-money trading.

## 11. All-level UX and full application review

- K01: Offer Quick view, Research and Advanced depths using the same canonical data. Allow users to move between them freely; choose investment horizon separately from presentation depth.
- K02: Quick view shows assessment, leading reasons, main risk, data age and next event. Research adds evidence, trends, scenarios, peers and structure. Advanced exposes inputs, formulas, settings, histories and exports.
- K03: Explain every major metric: definition, relevance to this company, calculation, source and limitations.
- K04: Retain the latest approved premium visual direction: restrained glass effects, clear hierarchy, readable typography, consistent spacing, useful charts and accessible contrast.
- K05: Fix search spacing and stale/hard-coded suggestions; duplicate research menus; missing valuation states; ticker links/logos; clipped values; mobile navigation spacing; date readability; chart scrolling and ranges.
- K06: Review every route: landing, authentication, verification/reset, onboarding, Today/dashboard, search/discovery, all company tabs, portfolio, watchlist, monitor/alerts, Paper Lab, settings/profile/preferences, help and logout.
- K07: Review all controls, forms, saves, filters, sorting, dialogs and empty/loading/error states. Preserve keyboard access, visible focus, touch targets, safe areas, screen-reader labels, reduced motion and non-color explanations.
- K08: Verify 320/375/390/430px mobile, tablet and 1280/1440/1920px desktop. Use the current approved references; disclose missing reference coverage.
- K09: Prioritize visible content, deduplicate requests, lazy-load expensive charts and avoid navigation resets or layout shifts.

**Acceptance:** All audited routes/actions function; no unexplained blanks, overlapping navigation, fake controls or hidden critical risk information. Responsive comparison evidence is included.

## 12. Discovery, briefings, comparison and grounded assistance

- L01: Build a personalized Today briefing showing material changes, relevant upcoming events, portfolio attention items and unchanged theses where useful.
- L02: Let watchlists store why the user is watching and the condition being awaited: evidence, milestone, valuation range or technical confirmation.
- L03: Add peer comparison with consistent definitions, periods, currency and appropriate business comparisons; explain non-comparable dimensions.
- L04: Add event-aware alerts for thesis changes, milestones, valuation assumptions and technical conditions, with deduplication, preferences and an in-app history.
- L05: Provide saved research views, comparison selections and reusable filters; avoid a new duplicate navigation system.
- L06: Add Ask AURYN explanations grounded in saved evidence and deterministic calculations, including why a decision changed and the strongest counterargument. Use existing authorized AI configuration where available; guided evidence questions remain useful without a new paid model.
- L07: Keep custom scenario outputs distinguishable from canonical decisions. Do not let an assistant response bypass trading policy.

**Acceptance:** Briefings and answers cite the relevant saved evidence; unsupported questions acknowledge limits; notifications reflect user settings and supported channels.

## 13. Model evaluation and learning

- M01: Version features, inputs, models, policies and outcomes. Preserve publication timestamps and the information available when each decision was made.
- M02: Compare the existing model and proposed changes on unseen periods using walk-forward evaluation, realistic costs/slippage, equal capital budgets and relevant benchmarks.
- M03: Report coverage, abstention, sample size, return, drawdown, turnover and calibration only where meaningful. Include poor results and uncertainty.
- M04: Prevent look-ahead, survivorship and selection bias as far as available data permits; disclose dataset limitations and keep final evaluation periods separate from tuning.
- M05: Run candidate models in observation mode before promotion. Recording paper trades alone is not self-learning; weight or policy changes remain versioned and reviewable.
- M06: Include price-only changes, missing fundamentals, restatements, dilution, structural breaks, stale feeds, market closures and high-growth versus mature-company cases.
- M07: Use representative stock/ETF/crypto cases, including IREN and ASTS, and verify classification of supported versus unsupported models.
- M08: Keep software correctness, operational verification and investment-performance validation separate. Long-horizon results that have not matured must remain unvalidated.

**Acceptance:** Reports are reproducible and reveal limitations; no historical fit, test count or simulated profit is described as proof of future returns.

## 14. Release validation, packaging and deployment handoff

- N01: Run dependency installation, type checking, configured lint, production build, relevant engine/unit/integration tests and browser end-to-end tests against the actual release.
- N02: Test authorization, cross-user data isolation, CRUD, data freshness, canonical consistency, paper safety, responsive layouts and failures/retries. Assess historical-suite failures rather than hiding or broadly disabling them.
- N03: Compare representative screens to approved references. Test a complete journey: discover, understand, inspect evidence, compare, review portfolio impact and save a paper plan. Human usability or physical-device checks are only claimed if actually performed.
- N04: Record test commands, versions, dates, results, screenshots and specific remaining blockers. Do not recycle earlier release counts as current evidence.
- N05: Produce ONE final ZIP containing complete source and lockfile, required workflows, migrations, safe environment examples, tests, verification reports, reference/visual comparisons, architecture notes and GitHub/Vercel instructions.
- N06: Include a file manifest and archive integrity checks. Exclude secrets, private account exports, node_modules, .next and transient build directories.
- N07: Provide concise executable Git/deployment steps using scripts verified to exist, including git add -A and forced adds for .github/workflows/auryn-v996-validation-queue.yml and .github/workflows/nivora-calibration-mature.yml, followed by the release commit and git push origin main.
- N08: Distinguish a source/build-verified release from a deployed, integration-verified release. Do not call the result fully production-verified if critical live flows remain unverified.

**Acceptance:** No included requirement is silently omitted. Each ID has evidence or a named blocker; a blocked feature is not counted as complete. No partial release ZIP is labeled final.

## 15. Explicit data-dependent and deferred boundaries

- O01: Full options-flow/gamma analytics remain deferred until a suitable licensed feed, methodology and budget are approved. The build may document capability/readiness and show a clear unavailable state; this is not delivery of full gamma analytics.
- O02: Reproduce useful UX patterns from Oura, Robinhood, Morningstar, Simply Wall St, Koyfin, TradingView, Fidelity and Public using AURYN's own designs, calculations and authorized data. Do not claim to reproduce proprietary ratings or undisclosed diamond/optimizer algorithms.
- O03: No new paid feed, model subscription or account-linking provider is included without a concrete cost/capability review. Existing entitlements and quota constraints remain in force.
- O04: Real-money automated execution is outside this build. Existing-paper-account verification and approved paper plans are in scope.
- O05: An arbitrary drag-and-drop terminal builder, social/copy-trading network and universal asset/model coverage are not included. Saved research views and supported asset coverage are included.
- O06: Missing required external evidence or restricted access is a blocker to the affected capability, not permission to fabricate data or call a placeholder finished.

## 16. Implementation order and approval

Work in dependency order, with one final release:

1. Baseline reconciliation, route inventory, integration diagnostics and data integrity.
2. Canonical decisions, business evidence, thesis tracking and supported valuation.
3. Technical structure, accumulation policies, portfolio intelligence and paper operations.
4. Full-page UX integration, Today/watchlists/comparison/alerts and grounded explanations.
5. Model evaluation, end-to-end verification, responsive comparison, packaging and deployment handoff.

Implementation order does not remove any included item. The dependency-level plan and requirement checklist will be maintained against this approved document.

**Approval requested:** Approve revision 1, or identify changes by section/ID. Approval means implement and verify all included work, with the section 15 boundaries preserved. It is not permission for real-money trading or additional paid services.

## Review evidence and design references

Code inspected on GitHub main during the October 16 review supports the identified technical-veto, admin-role and valuation-gate issues. It does not by itself establish the current deployed configuration or the exact cause of a specific symbol's displayed action.

- Canonical kernel: https://github.com/anudeepcare/nivora/blob/main/lib/auryn/v931/decision-kernel.ts
- Valuation gate: https://github.com/anudeepcare/nivora/blob/main/lib/auryn/v99910/fundamental-analyst.ts
- Authorization: https://github.com/anudeepcare/nivora/blob/main/lib/server/authorization.ts
- Paper schedule: https://github.com/anudeepcare/nivora/blob/main/.github/workflows/nivora-paper-trading.yml
- SEC data APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Alpaca paper simulation limitations: https://docs.alpaca.markets/us/docs/paper-trading
- Oura information hierarchy: https://support.ouraring.com/hc/articles/360058599753-How-to-Use-the-Oura-App
- Morningstar moat/uncertainty distinction: https://www.morningstar.com/portfolios/why-wide-moat-stocks-can-carry-high-uncertainty
- Koyfin feature patterns: https://www.koyfin.com/features/
- TradingView technical alerts: https://www.tradingview.com/support/solutions/43000763315-getting-started-with-technical-alerts/
- Fidelity portfolio analysis: https://www.fidelity.com/planning/investment/content/portanalyze.shtml
- Public recurring plans: https://help.public.com/en/articles/7260772-what-are-investment-plans
- Simply Wall St visual summary: https://support.simplywall.st/hc/en-us/articles/360001740916-How-does-the-Snowflake-work
- Robinhood chart depth: https://robinhood.com/support/articles/using-charts

