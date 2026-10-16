# AURYN product recovery audit — 16 October 2026

## Decision

The next build should repair the research product from data through interpretation to interaction. More cards, explanatory paragraphs, tabs, or composite scores will not resolve the present failures.

The central product task is: understand a company, evaluate its price and risks, decide whether to research, wait, accumulate or reduce, and monitor the evidence that would change that decision. Every visible module must contribute to that task with identifiable evidence or a usable action.

This is an audit and proposed recovery scope, not a completed rebuild. No product code or live database was changed during this audit. Existing uncommitted implementation work remains in place. No new paid service is proposed.

## Evidence and limits

- Inspected six supplied screenshots covering research home, search, Today, IREN research and valuation.
- Reviewed the eleven stock research tabs, shared components, main workspace pages, technical calculators, financial model coverage, planning policy, options and context contracts, portfolio and paper-operation source.
- Read-only live database inspection found zero investment scan rows; scan-state universe count was 6,286 but investment scanned/fresh counts were both zero. The research workspace and company source review tables were absent in the inspected database.
- Executed small synthetic inputs against current technical source. Reproduction: `node scripts/audit_product_technicals.cjs`. Results are in `verification/product-audit-2026-10-16/technical-probes.json`.
- Checked primary documentation for indicator definitions, provider coverage and useful competitor interaction patterns.
- This is not an authenticated end-to-end production retest, a complete numerical certification of every indicator, a broker execution test, or evidence of investment performance. Static diagnoses are identified separately from reproduced outputs. The deployed application revision and every production environment setting were not reconciled.

## 1. Findings that must precede another visual release

| Priority | Finding and evidence | Required correction |
| --- | --- | --- |
| P0 | Live research workspace/source-review tables are missing. Workspace GET reads the new storage before existing watchlist/positions; failure can suppress useful existing data. | Complete and verify deployment prerequisites. Isolate optional workspace storage failures from holdings and watchlists. Show an actual service error rather than an empty successful dashboard. |
| P0 | Discover has no populated investment scan data in the inspected database. | Repair and observe the ingestion/scanning pipeline, freshness and canonical assessment coverage before publishing rankings. |
| P0 | Synthetic rising bars without any benchmark still produce `Leading` and a positive relative-strength value. | Missing benchmark must make relative comparison unavailable; it must not silently contribute a zero-return benchmark to scores. |
| P0 | Synthetic zero-volume bars produce relative volume 1, participation 47, MFI 50 and a numeric volume-profile POC distance. | Preserve unavailable volume; abstain from volume-dependent interpretations and scores. |
| P0 | Synthetic flat prices produce RSI 100 and MFI approximately 99.01. | Define and validate flat-series and zero-flow behavior; prevent a motionless series being presented as extreme buying pressure. |
| P0 | A 60-bar history produces a field labeled 52-week drawdown. | Require the stated history or relabel the actual window. Use asset-appropriate sessions and annualization. |
| P0 | Frontier business-model classes are assigned unavailable business quality in the financial assessment; several specialized valuations are explicitly not implemented. | Implement and validate model-specific evidence and assessments. A provider upgrade alone will not complete these models. Do not turn unavailable into bullish or bearish. |
| P1 | Several provider failures become empty arrays/null data, while surrounding summaries remain enabled or reassuring. | Carry success, partial, stale, unavailable and error states through every adapter and screen. “No events found” requires a successful query. |
| P1 | Chart creation effect depends on candles, levels and overlay object identities; changes remove and recreate the chart and reset zoom. Polling and appearance listeners can cause repeated updates. | Keep a stable chart instance and update data incrementally. Preserve viewport, selected range, tab and scroll. Reproduce the reported refresh behavior in the browser before claiming the whole issue fixed. |
| P1 | Options convert some missing numeric fields to zero, rank contracts without sufficient quote/liquidity eligibility, cache for hours and use a hard-coded delay label. | Preserve missing fields, verify per-contract timestamps and entitlement, use freshness/liquidity gates and correctly label the feed. |
| P1 | DCA is a tucked-away policy calculator with a user-selected multiplier, not an automatically justified optimizer. Stock and portfolio callers supply different incomplete inputs. | Build one visible accumulation workflow with consistent portfolio/evidence inputs and a transparent adaptive-policy explanation. |

These issues can coexist with passing builds and fixture tests. Those tests establish limited implementation behavior; they do not establish a useful live research product.

## 2. All eleven research tabs

| Current area | Keep | Remove, consolidate or repair | Useful replacement/output |
| --- | --- | --- | --- |
| Overview / Thesis | Separate business quality, valuation and entry timing; linked evidence; price chart | Repeated WAIT/WATCH/UNASSESSED panels, duplicate coverage/confidence, generic catalyst paragraphs, internal engine terminology | One decision summary with evidence date, two specific drivers, principal risk and next observable trigger. Chart with selective levels, not every study. |
| Business / Fundamentals | Sourced operating metrics, annual trends, reviewed moat claims and citations | Raw business-model IDs; financial history repeated elsewhere; generic thesis explanations without company evidence | Business model diagram or segment mix where data supports it; growth/profitability trends; company-specific operating KPIs; moat claim, evidence and counterevidence. |
| Financials | Reported values, currency/period provenance, comparable history | Same revenue/net income/cash-flow blocks repeated from Business; long undifferentiated metric lists | Quarterly/annual switch; aligned revenue, margin, cash generation, balance sheet and share-count charts; current/prior/change table; expandable filings. |
| Earnings | Dated earnings information and reported surprises | Generic filing/news tiles in place of earnings analysis; estimated dates presented without clear status | Latest quarter versus prior year and guidance; revenue/EPS surprise history where supplied; guidance changes; confirmed versus estimated next date. Make this a Financials subview. |
| Valuation | Eligibility gates, explicit assumptions, scenario workbench | Wall of internal model names and missing-field diagnostics; generic scenarios mistaken for company forecasts | Model suited to the business, bear/base/bull assumptions and sensitivity, price-versus-range chart, dilution/capital needs, model limitations in one disclosure. Unsupported models remain clearly unavailable until finished. |
| Technicals | Price/volume, trend, momentum, levels, weekly structure and selectable studies | Overlapping composite votes, misleading missing-input outputs, repetitive methodology copy | Four readable groups: trend, momentum, participation, structure/risk. Numeric studies and formula details available on demand; actionable observations only when supported. |
| Risk | Actual vetoes, evidence gaps and thesis counterevidence | Generic risks inferred only from low pillar scores; raw veto IDs; duplicate confidence panels | Company risk register with evidence, materiality, trend and a measurable thesis-break condition. Summarize the main risk in Overview; retain detailed risk inspection. |
| Catalysts | Dated events and filings | Duplicate News list, generic “macro context,” estimated earnings as the only useful event | Unified Events timeline with earnings, guidance, filings, financing and reviewed operating milestones; fact versus expected event; link to the thesis affected. |
| News | Source links, dates and actual headlines | Keyword sentiment or “material” tags presented as deep analysis; repeating the same story across tabs | Deduplicated stories within Events, with a short sourced account of what changed. If interpretation is uncertain, show the headline without a manufactured conclusion. |
| Ownership | Matched reported holdings periods; insider purchase/sale/grant/exercise separation | Price/volume proxy positioned as institutional knowledge; repeated context blocks | Ownership change table with filing dates and coverage, insider transaction timeline, delayed-report labels. Never call these live whale flows. |
| Options | Real chains/Greeks when licensed and available; expiry and strike selection | Missing values as zeros; “safer” as an absolute claim; dealer-gamma conclusions from an OI sign convention | Tradable-data eligibility, bid/ask and age, payoff/risk, break-even and scenario behavior. Label OI/gamma approximations explicitly. Place within an advanced workspace. |

Proposed primary stock navigation: Overview, Business, Financials, Valuation, Technicals, Events, Ownership. Earnings remains inside Financials; News and Catalysts share Events. Risk remains inspectable through a persistent risk link; Options has an advanced entry. Accumulation planning is a prominent action rather than a buried extra tab. This consolidates duplicated presentation without dropping capabilities.

Quick versus detailed research should change information density and explanation depth, not produce conflicting assessments or simply add more paragraphs above the same page.

## 3. Technical study inventory and treatment

All families below were examined in source. Only the specific synthetic probes noted above were independently executed in this audit. Every retained formula still needs reference-vector and point-in-time validation before release.

| Family / studies | Audit disposition |
| --- | --- |
| Trend: SMA/EMA 20, 50, 200; distance from each MA; trend composite | Keep. Require per-study warm-up. Current short-history EMA fallback can enter the trend score even while 200-day SMA is unavailable. Clearly identify SMA versus EMA. |
| RSI 14, MACD/histogram, stochastic %K, CCI 20, ROC 20D | Keep as selectable momentum evidence. Fix flat RSI; validate warm-up and zero-range states. Correlated oscillators are not independent confirmations. Oversold alone must not be a positive investment recommendation. |
| Relative strength versus benchmark and market regime | Keep only with aligned, sufficiently complete benchmark observations. Missing benchmark currently defaults into a comparison. Name the benchmark and comparison interval. |
| Relative volume 20D, participation, volume dry-up 5D/20D | Keep with actual volume coverage. Clarify whether the measure is current-bar volume or recent-average volume. A partial intraday bar is not comparable to a completed full day without adjustment. |
| MFI 14, CMF 20, OBV slope | Keep as price/volume indicators, not named investor flows. Fix unchanged typical-price handling and zero-volume cases; validate signs and denominator behavior. |
| ATR 14 / ATR%, realized volatility 20D | Keep for risk context and sizing. Unify client/server variants: current fallbacks differ in ATR smoothing and volatility calculation. Use asset-appropriate annualization and state the window. |
| Bollinger position/width, Keltner position, squeeze | Keep as optional compression/extension studies. Unify formula variants. Clamping band position discards how far price extends beyond the bands. High volatility is not automatically bearish direction. |
| ADX 14, DMI spread | Keep in detailed trend view. ADX is trend strength, not direction. Validate calculation against a named reference implementation and warm-up convention. |
| Ichimoku | Repair before using its direction. Current calculation compares price with unshifted latest spans; standard cloud construction shifts leading spans 26 periods. Require enough history for the chosen interpretation. |
| Donchian position, support/resistance, ATR-derived levels | Keep. Distinguish observed pivots from estimated bands. Do not describe an ATR estimate as a price level repeatedly defended by buyers. |
| Rolling 20D VWAP | Keep with explicit daily-bar approximation and rolling-window label. It is not session intraday VWAP. |
| Anchored VWAP | Keep with a visible anchor date and selection method. Current lowest-low-in-60-bars anchor moves as the window moves; it is not automatically a persistent historical anchor. |
| Volume-profile POC | Restrict to clearly labeled daily-bar proxy. Current bins allocate daily volume using a typical-price approximation, not full traded volume at each price. Zero-volume series must not generate a POC. |
| Drawdown / 52-week high | Repair history-length and asset-calendar semantics. A short listed history can show “since available history,” not a fabricated full-year window. |
| Fibonacci .236, .382, .5, .618, .786; extensions 1.272/1.618; custom .686 | Keep with anchor dates, direction and adjustment basis. .686 is custom, not a standard ratio. Confluence is a zone with uncertainty, not proof of support. |
| Weekly SMA/WMA 50/200 and weekly structure | Keep clear period/type labels, consecutive-history requirements and forming-week status. Current UTC-week exclusion needs exchange-session handling, including completed Friday sessions. Young companies may legitimately lack a 200-week average. |
| Base, breakout, double bottom, reclaim markers | Repair state logic before “confirmed” labels. Current breakout compares against resistance recalculated above the same current price; freeze a prior level and evaluate a later completed bar. Double-bottom confirmation must use the intervening neckline rather than a fixed percentage over lows. Record when a pivot first becomes knowable. |
| Multi-timeframe 15M/1H/4H/1D/1W | Preserve only supported timeframes with their actual bars and timestamps. Label technical direction separately from long-term business assessment. Do not present each correlated timeframe as independent proof. |
| Technical strength, entry quality, participation and other composites | Retain only if explainable, coverage-aware and shown to add information. Prevent duplicate weighting of the same trend/momentum inputs. Their numbers are model scores, not calibrated probabilities. |

The beginner presentation should expose a small, useful selection; the full study library remains available to experienced users. More visible indicators do not by themselves create a better decision.

## 4. Fundamental and intelligence engine recovery

1. **Separate evidence dimensions.** Business quality/durability, valuation, entry timing, portfolio fit and evidence coverage must remain distinct. Weak price action cannot establish a broken long-term business thesis; strong technicals cannot establish a moat.
2. **Finish model coverage.** The current mature-company quality proxy uses available revenue growth, operating margin and FCF margin. That is useful financial evidence, but not proof of competitive durability. Frontier classes and specialized valuation models need actual implementations and business-specific facts.
3. **Use company-specific operating evidence.** Examples of fields to investigate—not asserted current facts—include capacity, utilization, funding and contracts for infrastructure; deployed capability, commercial milestones, cash runway and dilution for pre-scale space businesses; retention and unit economics when disclosed by software businesses. Each fact needs period, unit, source passage and availability date.
4. **Understand data limits.** SEC Company Facts covers standardized, whole-entity concepts. Custom operating KPIs often require the underlying filing or issuer exhibit. Adding a generic API will not fill every business-model field.
5. **Treat forecasts honestly.** The current forward-evidence path is unavailable and some scenario assumptions are generic policy examples. Do not describe them as analyst consensus or company-specific forecasts. Separate reported facts, management guidance, user assumptions and model estimates.
6. **Build a thesis record.** Show the investment proposition, evidence supporting it, strongest counterevidence, next milestone and measurable failure condition. Keep source passages inspectable and date every assessment.
7. **Rename confidence appropriately.** An available-pillar count is coverage. A claim of predictive confidence needs out-of-sample calibration, not a completeness percentage.
8. **Validate before promoting.** Compare any adaptive policy to fixed DCA and other relevant baselines using frozen point-in-time inputs, costs, drawdowns, turnover, abstentions and a holdout period. No automatic weight promotion from paper trades without a reviewed evaluation.

## 5. Main product flows

| Area | Required product behavior |
| --- | --- |
| Research home / search | Fast, correctly spaced search; canonical symbol/exchange/asset identity; recent or followed securities with genuine context. Resolve logos consistently with an immediate fallback. A loaded blank/transparent image must not leave an empty badge. |
| Today | Personal changes since last review: holdings/watchlist evidence changes, approaching events, plan constraints and stale data needing attention. Each item links to evidence/action. With no tracked securities, offer one useful setup action. On backend failure, show that failure; never replace it with reassuring zeros. |
| Discover | Actual filterable company results with coverage, source freshness and comparable business-model metrics. Useful saved screens and peer comparison. Do not duplicate Today or rank unpopulated/stale records. |
| Watchlist | One consistent identity/quote component, research status, upcoming event and personal thesis note. Existing watchlist access must survive optional notes-storage failure. |
| Alerts | State exactly what is monitored, when it was last checked and how it is delivered. Current manual-refresh in-app comparisons are not continuous notifications. Implement scheduled evaluation before presenting continuous monitoring. |
| Accumulation / DCA | Visible budget, cadence, baseline amount, holdings/cash limits and evidence-based adjustment explanation. Current 0/.5/1/2/4 choices are manual policy inputs. Distinguish incomplete inputs, paused policy, proposed plan and scheduled execution. A plan is not an order or recurring scheduler. |
| Portfolio | Reliable holdings, cash, cost basis, valuation coverage and linked securities first; allocation/concentration and upcoming risks next. Returns must respect external cash flows. Manual balance snapshots alone are not time-weighted performance. Unavailable sector/theme evidence must not look measured. |
| Paper trading | Clear readiness, permissions, broker connection, buying power, pending orders, fills/rejections and pause state. Preserve server-side authorization and order reconciliation. Verify scheduler and idempotency with the configured paper account before declaring unattended operation ready. |
| Research Lab / calibration | Move static hypothesis counts and operational diagnostics into advanced/admin tools. Show actual experiments, sample size, coverage and results when available. Counts and methodology text do not establish an edge. |
| Account / onboarding | Use experience and investment-interest settings to shape explanation depth and defaults. Current source writes these preferences but does not meaningfully consume them in the reviewed product components. |
| Crypto | Asset-specific research layout, venue/time basis and 24/7 periods. Hide inapplicable corporate earnings/financial models; do not imply stock-specific fundamentals or unavailable on-chain evidence exist. |
| Help / methodology | Contextual help must open by touch, keyboard and pointer. Preserve transparent methodology in a dedicated location instead of repeating it in every primary card. Full accessibility and real-device verification remain required. |

## 6. UX rules for the rebuild

- Every metric should answer: what is the value, compared with what, for which period, from which source, and why does it matter? Use concise help for the explanation.
- Above the fold: security identity, quote/session freshness, assessment with its horizon, two specific evidence drivers, principal risk and next trigger. Never fill missing evidence with generic prose.
- Use charts for history, ranges and comparisons; tables for exact comparisons; short prose for interpretation. Avoid decorative scores that simply restate adjacent numbers.
- Put raw model IDs, missing-field diagnostics and provenance mechanics in inspectable diagnostics. Explain the user-relevant limitation in plain language.
- Keep one assessment per security/horizon across surfaces. A change of tab must not create a different buy/sell conclusion.
- Preserve scroll, selected tab, range and chart viewport during background updates. Update changed values without flashing the whole page. No forced scrolling after routine data refreshes.
- Use restrained glass surfaces for navigation and hierarchy, strong text contrast and consistent spacing. Premium presentation must remain legible on a small phone and in reduced-motion/reduced-transparency settings.
- Use one shared interaction system for logos, tooltips, disclosures, empty states, errors and timestamps. Every information icon must work.

## 7. Cost-conscious implementation order and release gates

| Order | Concrete work | Evidence required to call it complete |
| --- | --- | --- |
| 1 | Repair deployment prerequisites and provider contracts | Workspace persistence and isolation verified; populated fresh discovery records; actual coverage/entitlements inventoried; provider errors distinguishable from empty results. |
| 2 | Correct and unify technical calculations | Reference-vector tests, missing/flat/zero-volume/short-history cases, split-adjustment and session handling, point-in-time pattern tests; no conflicting client fallback calculations. |
| 3 | Complete company evidence and business-model coverage | Real-company records with cited financial/operating data; explicit supported and unsupported dimensions; reviewed specialized models and scenario assumptions. |
| 4 | Consolidate the stock research journey and repair shared interactions | All eleven existing areas accounted for; no duplicated primary panels; stable chart and navigation state; usable logos/tooltips; real-data phone and desktop checks. |
| 5 | Connect Today, Discover, Portfolio, alerts and accumulation | One journey works from discovery to evidence to saved thesis to budgeted plan to monitored change. DCA explains the proposed amount and constraints. Scheduling and notification capabilities match their labels. |
| 6 | Verify configured paper operations and release | Authorized paper lifecycle, duplicate prevention, pause/reconcile and runner status tested; no live-money action. Fresh checkout builds and runs documented tests; source archive contents and deployment steps verified. |

Use the already-paid providers first. Cache by data type and security, fetch expensive fundamentals around filing changes, reuse server results across views, and avoid universe-wide refreshes on page visits. Track actual per-endpoint credit costs and usage. Twelve Data batching still consumes credits per symbol; profile, financial and institutional endpoints have different access tiers. A new subscription requires an identified data gap and measured value, not a generic promise of better intelligence.

Acceptance must include real-data cases for mature profitable, cyclical, financial, pre-scale, infrastructure and other supported business models, plus crypto and sparse-history assets. Include IREN, ASTS and APP because these are user-reported problem cases, without presuming their investment merits. Exercise successful, partial, stale, unavailable, rate-limited and failed responses.

Reconcile the existing 104-requirement register against these gates. A hidden panel, an unavailable placeholder or a passing fixture is not completion of its underlying capability. Preserve the requested advanced features while clearly separating implemented, verified and still blocked work.

## 8. Primary references and local evidence map

External references checked during this audit:

- Fidelity Ichimoku definition: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/Ichimoku-Cloud
- Fidelity Money Flow Index: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/MFI
- SEC EDGAR API coverage: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Twelve Data credit accounting: https://support.twelvedata.com/en/articles/5615854-credits
- Twelve Data batching: https://support.twelvedata.com/en/articles/5203360-batch-api-requests
- Market Data freshness/entitlements: https://www.marketdata.app/docs/account/data-freshness/
- TradingView screener interaction pattern: https://www.tradingview.com/support/solutions/43000718866-tradingview-stock-screener-trade-smarter-not-harder/
- Koyfin financial analysis templates: https://www.koyfin.com/help/financial-analysis-templates/
- Robinhood recurring investment task structure: https://robinhood.com/us/en/support/articles/recurring-investments/

These product references support useful interaction patterns, not permission to copy proprietary algorithms or a claim that AURYN matches their capabilities. The DCA Optimizer page was not accessible through the research tool; its private algorithm was not reviewed or reverse-engineered.

Principal local files reviewed:

- `components/StockClient.tsx`, `components/premium/AurynResearchOverviewV2.tsx`
- `components/research/BusinessEvidence.tsx`, `ValuationWorkbench.tsx`, `ResearchDepth.tsx`, `WeeklyStructure.tsx`
- `components/ResearchWorkspace.tsx`, `components/PlanningWorkbench.tsx`, `components/PriceChart.tsx`
- `lib/nivora-technical-engine.ts`, `lib/quant.ts`, `lib/auryn/v5/metrics.ts`, `lib/auryn/v5/technical-patterns.ts`
- `lib/research-structure.ts`, `lib/research-financial-assessment.ts`, `lib/auryn/v931/canonical-assessment.ts`
- `lib/auryn/planning/policy.ts`, `lib/auryn/workspace/model.ts`
- Workspace, discovery, company, institutional, context, options and paper-operation API routes; portfolio, onboarding, research-lab and calibration page source.

The next useful deliverable is a repaired, evidence-backed research journey demonstrated with real data and failure cases—not another broad visual release whose underlying coverage remains empty.
