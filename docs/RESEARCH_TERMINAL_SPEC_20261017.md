# AURYN research terminal — implementation and acceptance contract

17 October 2026. Owner direction: a useful investment decision product, simple on iPhone and desktop, with company-specific research and explicit buy/watch/hold/trim/exit conditions. Reuse existing paid data before considering any additional subscription. This is the replacement specification, not a claim that its models are implemented or profitable.

## What has actually been checked

- The four earlier screenshots and the two APP screenshots were inspected against their actual components.
- Connected Twelve Data quotes returned all 11 requested instruments: NBIS, IREN, APP, NOW, MSFT, AAPL, NVDA, GOOG, META, CIFR, ETH/USD. The ten equity observations are dated October 16; ETH/USD is an October 17 observation. See `verification/cohort-quotes-20261017.json`. Apple and NVIDIA aliases resolve to AAPL and NVDA in this acceptance list. These observations do not establish production API parity or correct fundamental calculations.
- APP $266.13 and NBIS $165.47 match the supplied AURYN screenshots. A different competitor quote date must be reconciled before comparing valuations or upside percentages.
- The connected Twelve Data `/cash_flow` request for APP was denied by its current plan. The existing EODHD integration must supply statements where entitled, with filing checks. No EODHD live response was inspected in this turn. Do not request another purchase on the basis of this denied endpoint.
- Primary-source reviews identified material interpretation requirements: NBIS investment gains versus operating losses; IREN AI/mining transition, impairments, operating ARR versus contracted ARR; CIFR leased data-center deployment and project funding; Alphabet non-operating investment gains and distinct business segments; Meta capex including finance lease principal. These are examples of rules to generalize, not hardcoded investment ratings.
- Screenshot repairs: correct proportional quote axis; explicit custom-calculator labels; contextualized debt; an operating-loss guard on the buy-candidate rule; removal of the empty ten-input scenario form; financial-evidence layout and ownership/analyst alignment fixes.
- Still unverified: full live financial reconciliation across the cohort, 20–30-stock competitor comparison, post-change rendered desktop/mobile acceptance, physical-iPhone standalone PWA, production EODHD behavior, calibrated predictive performance.

## 1. One data contract before any investment label

Every observation carries instrument ID, exchange, share class/ADR ratio, reporting currency, units, period start/end, publication time, retrieved time, source URL and definition. Keep reported GAAP/IFRS, management-adjusted measures, analyst forecasts and AURYN assumptions separate. Share count, market cap and quoted share units must agree. Never infer an ADR ratio from a ticker or translate EUR statements into USD merely because the quote is USD.

TTM means four compatible quarters, or compatible annual plus current YTD minus prior YTD. Reconcile acquisitions, discontinued operations and restatements. Do not sum cumulative quarterly cash-flow values as discrete quarters. Distinguish cash capex, capitalized software, finance leases and stock compensation. Do not deduct the same economic stock-compensation cost twice through both cash-flow adjustment and dilution.

Use a versioned, persistent research snapshot shared by every tab. Quote refresh must not replace a reporting-period snapshot or reset UI state. The current process-local provider Maps do not provide a durable cross-instance cache; a persistent cache and request deduplication are required for the replacement. Retain the last valid snapshot during a refresh and label its timestamp.

## 2. Business-specific valuation coverage

These are proposed valuation methods and required evidence, not current recommendations or validated target prices.

| Acceptance instrument | Model and evidence that must drive it | Failure to prevent |
| --- | --- | --- |
| NBIS | Revenue/capacity ramp, operating margin path, installed vs contracted capacity, utilization, refresh and expansion capex, cash/debt/leases, customer concentration and future equity funding; multi-stage enterprise cash flow with an equity bridge | Calling negative current FCF permanent failure, counting planned capacity as operating, or capitalizing revaluation gains as recurring earnings |
| IREN | Separate mining and AI cloud during transition; delivered capacity and operating ARR; contract start dates, utilization, GPU financing, impairments, capex and dilution; sum of parts with a funded deployment schedule | Treating contracted ARR as recognized revenue or hardware impairments as recurring cash expense |
| CIFR | Project-level lease cash flows and deployment dates, power/IT capacity units, tenant terms, construction obligations, project debt, residual operations and corporate costs | Applying a GPU-cloud margin to a data-center landlord or counting an undeveloped site option as leased operating capacity |
| APP | Advertising revenue drivers, operating margin durability, normalized cash generation, platform/customer concentration, SBC and net share changes; enterprise DCF plus matched forward-multiple cross-check | Reusing generic zero-growth examples or treating one profitable period as a durable moat |
| NOW | Subscription revenue, cRPO/RPO definitions and conversion, renewal/retention where disclosed, sales efficiency, margin path, SBC and dilution; SaaS DCF and peer-growth/margin cross-check | Mixing GAAP and adjusted margins or assuming all contracted backlog is next-year revenue |
| MSFT | Segment growth and margins, cloud infrastructure reinvestment, leases, cash taxes, recurring operations versus investment gains; segment-aware DCF and reverse DCF | Treating investment revaluations as recurring cloud profit or excluding material lease funding |
| AAPL | Products/services economics, replacement demand, geographic mix, margins, capital returns and share-count changes; mature cash-flow model and normalized earnings cross-check | Confusing total profit growth with per-share growth from buybacks |
| NVDA | Segment demand, customer concentration, export restrictions, product-cycle margins, working capital and reinvestment; cycle-aware DCF and forward multiples | Extrapolating a single high-growth quarter indefinitely or mismatching fiscal and calendar years |
| GOOG | Search/YouTube, Cloud, Other Bets and shared costs; capex, cash taxes, share classes and investment revaluations; sum-of-parts/enterprise DCF with explicit non-operating assets | Capitalizing unrealized investment gains as recurring operating profit or counting an asset twice |
| META | Advertising drivers, Family of Apps versus Reality Labs, margin path, AI capex and finance leases; segment cash flows and reverse DCF | Excluding investment obligations to make cash yield appear stronger |
| ETH/USD | Network activity and fee capture, issuance/burn, staking economics, liquidity, supply, market regime and ETH/BTC relative strength where available | Corporate earnings/P-E/DCF, ETF substitution, or calling every network fee income paid to every token holder |

Bank, insurer, REIT, cyclical, commodity and pre-revenue categories require separate coverage before universal-stock claims. Model selection uses dated business evidence and segment mix; a ticker exception alone is insufficient.

## 3. Valuation implementation

Forecast company revenue and operating margins, cash taxes and reinvestment. For enterprise DCF, discount unlevered cash flows consistently at a cost of capital; reconcile non-operating assets, debt, lease treatment, other claims and diluted shares to equity value. For equity cash flows, use equity cash flows and cost of equity consistently. Negative early cash flows are allowed when the financing and eventual economics are explicitly modeled.

Bear/base/bull cases have named driver changes and traceable inputs. Base is a documented central scenario, not a zero-growth default. Analyst low/high estimates are dispersion, not confidence intervals. No invented probabilities. Cross-check with economically matched peers, normalized earnings and reverse DCF. Show disagreement and terminal-value dependence; do not average incompatible models into a precise target. Forecasts need their publication date, fiscal period, analyst count and currency. Missing important inputs block that estimate while other research remains usable.

## 4. Decision and accumulation logic

Keep four judgments distinct: business evidence, valuation, entry timing and portfolio exposure. A user sees a concise action candidate plus the strongest reason, principal risk and what would change it. A weak chart alone cannot invalidate a long-term business thesis. A low price or strong chart alone cannot establish an attractive investment.

Define actionable conditions against the selected horizon. New-capital actions are accumulate candidate, watch or pass; existing-position actions are hold, review trim or review exit. Portfolio concentration can support trimming while the business thesis remains intact. Missing data is its own status, not an automatic sell or a generic universal wait. Confidence describes evidence completeness and model sensitivity until predictive probabilities are independently calibrated.

DCA remains an original, documented variable-contribution policy. Show confirmed monthly 0×–4×, a separate forming month, historical zones, and next-zone conditions. Multipliers refer to a baseline contribution, not leverage or return forecasts; no amount entry is needed to inspect a stock. Fundamental deterioration, funding risk and exposure constraints must be visible beside any high multiplier. A monthly price-only extreme cannot by itself produce a high-conviction buy verdict.

## 5. AI research and costs

Use retrieval from dated filings, earnings releases and permitted transcripts to extract drivers, guidance, catalysts and counterevidence. Every factual sentence links to supporting evidence. AI drafts explanations and challenges assumptions; deterministic code calculates numbers. Store evidence and model version so the same snapshot gives consistent answers across tabs. Documents can contain untrusted instructions; they never control tools, trades or secrets.

Cache document extraction and company research; regenerate when the underlying evidence changes. Keep provider keys server-side, deduplicate calls and use the subscriptions already owned. New AI spend, new vendor plans and brokerage execution are not enabled by this specification. Public research access does not mean access to every paid dataset or competitor's proprietary algorithm.

## 6. Product surface

The opening research view contains company identity and dated quote, a short decision strip, proportional price chart, value range when supported, and a compact DCA signal. Beneath it: three drivers, principal risks, next catalyst and concise trend visuals. Full statements, assumptions and sources remain accessible without making every metric an accordion.

Default views present completed analyses. Advanced calculators are optional tools. Avoid giant empty forms, repeated review text, matching empty columns, nested panels and unexplained unlabeled numbers. Charts preserve page scrolling. Navigation stays stable during data refresh. Desktop uses the available width; iPhone standalone respects top/bottom safe areas, keyboard and persistent navigation. Light/dark are tested with the same content.

## 7. Acceptance and performance evidence

For every cohort instrument: assert identity and currency; reconcile price/date, reporting periods, net income, operating income, OCF, cash capex, software, cash/debt and shares; verify forecast periods and definitions; inspect model fit; manually recompute representative outputs. Compare competitor figures only after matching dates, units and assumptions. Record unresolved differences rather than forcing agreement.

For strategies: fixed rules, chronological training/validation/test separation, point-in-time availability, delisted names, corporate actions, fees/slippage, turnover and rolling regimes. Compare equal externally contributed capital, carried cash and idle-cash return for variable DCA versus fixed DCA. Judge expectancy, drawdown, total return and benchmark-relative results alongside win rate. A high win rate can still lose money. Publish negative findings and uncertainty. The named popular stocks are a functional acceptance set, not an unbiased performance sample.

For UI: inspect actual production components on desktop and iPhone-sized viewports, then physical standalone PWA. Test search, tabs, chart periods, tooltips, refresh, keyboard, watchlist/portfolio actions, authentication and failure states. Build/tests alone do not satisfy this gate. No final release label before both data and visual acceptance are recorded.

## Primary research references

- Valuation design: https://pages.stern.nyu.edu/~adamodar/New_Home_Page/littlebook/younggrowthvaluedrivers.htm and https://pages.stern.nyu.edu/~adamodar/pdfiles/papers/younggrowth.pdf
- Backtest selection bias: https://carmamaths.org/jon/backtest2.pdf
- NBIS: https://www.sec.gov/Archives/edgar/data/1513845/000110465926094844/nbis-20260812xex99d2.htm
- IREN: https://iren.gcs-web.com/news-releases/news-release-details/iren-reports-fy26-results
- CIFR: https://investors.cipherdigital.com/news-releases/news-release-details/cipher-digital-provides-second-quarter-2026-business-update
- APP: https://investors.applovin.com/news/news-details/2026/AppLovin-Announces-Second-Quarter-2026-Financial-Results/
- NOW: https://investor.servicenow.com/news/news-details/2026/ServiceNow-Reports-Second-Quarter-2026-Financial-Results/default.aspx
- MSFT: https://www.microsoft.com/en-us/investor/earnings/fy-2026-q4/press-release-webcast
- AAPL: https://www.apple.com/newsroom/2026/07/apple-reports-third-quarter-results/
- NVDA: https://investor.nvidia.com/news/press-release-details/2026/NVIDIA-Announces-Financial-Results-for-Second-Quarter-Fiscal-2027/
- GOOG: https://s206.q4cdn.com/479360582/files/doc_financials/2026/q2/2026q2-alphabet-earnings-release.pdf
- META: https://investor.atmeta.com/investor-news/press-release-details/2026/Meta-Reports-Second-Quarter-2026-Results/
- ETH: https://ethereum.org/eth/supply

References establish methods and source documents. Listing a reference does not establish that every metric was reconciled, that all models are implemented, or that a profitable strategy exists.
