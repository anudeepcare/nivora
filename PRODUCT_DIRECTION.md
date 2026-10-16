# AURYN: a useful investment product for one developer

Product direction from the owner's October 15, 2026 feedback. This document distinguishes the current repair from proposed investment features. It is not a claim that the proposed features are implemented, that a model is profitable, or that live trading is enabled.

## Product promise

Help an investor understand a business, assess what its price assumes, decide whether to commit more money, and monitor whether the ownership thesis has changed. Preserve the approved blue/navy visual identity. A phone should make these decisions easier to understand without forcing the investor through eleven dense tabs.

The primary user is the owner of this project. The architecture should support a later small customer base without paying to recompute the same public research for each visitor. No additional paid data service is required by this repair. There is no authorization to buy a subscription or submit a real-money order.

## What the screenshots and code revealed

| Finding | Why it matters | Product response |
| --- | --- | --- |
| NBIS history displayed the old entity's RUB revenue as dollars | Incorrect units contaminate ratios and apparent business quality | Preserve currency and filing periods; use compatible facts; flag reporting changes |
| Financial selection treated annual filing forms as annual periods | A filing also contains shorter comparative periods | Validate duration, period and restatement selection before deriving metrics |
| “Moat” was a transformed five-year financial record | Financial consistency alone does not establish a competitive advantage | Name this financial durability; require cited drivers/threats for moat claims |
| AVOID, HOLD and ATTRACTIVE/UNATTRACTIVE appeared together | New-money timing and an owner's multi-year thesis answer different questions | Explain each horizon beside its canonical action |
| Tactical invalidation prices were labeled THESIS | A chart level can be mistaken for business failure | Label setup invalidation; explain fundamental thesis breaks separately |
| Valuation stayed blank behind a permanent zero-cross-check gate | Refreshing a quote cannot complete an unimplemented valuation model | Disclose model/validation gaps and required inputs honestly |
| Reentering Overview refetched chart ranges and 5Y history | Wastes bandwidth, provider budget and loading time | Deduplicate requests, bound caches and keep evidence clocks independent |
| Technical evidence was rendered as concatenated text | Hard to compare on desktop and especially on a phone | Give each timeframe and level a readable cell |

The attached screens are predominantly desktop captures, not measurements of an iPhone. Browser checks and request-count tests are useful evidence; they cannot certify real-device Safari speed.

## The decision workspace

Use the current three-clock architecture. Do not let a new chart indicator become a second recommendation engine.

1. **Business:** What does the company sell? Why do customers choose it? Is its financial condition improving? What specifically could damage the business?
2. **Value:** Which valuation method fits this business? What are the bear/base/bull assumptions, reporting dates, share count and uncertainty? Is the expected result attractive at the observed price?
3. **Deployment:** Given those findings and the investor's current exposure, is this a time to start, add, hold, trim or wait? Technicals inform execution timing. They do not independently prove or destroy the business thesis.

The first screen should distinguish **new money**, **existing position**, and **multi-year view**, followed by the main reason, missing evidence, and what would change the answer. A model score is not a calibrated probability of making money. “Unknown” is a valid answer.

Useful research can remain visible while execution is blocked. Quotes, filings and completed-bar analysis each need their own source timestamp. A fresh quote must not make an old fundamental record appear fresh.

## Business and moat research

Show measured operating evidence before scores: revenue, operating profitability, operating cash flow, capital spending, free cash flow, cash/debt, share dilution and the relevant reporting period. Distinguish annual, quarterly, trailing and point-in-time data. Use continuing operations and comparable units where supported; otherwise disclose the limitation.

A moat assessment requires a reason and counter-evidence, not just a number:

| Advantage | Evidence to seek | What would weaken it |
| --- | --- | --- |
| Switching costs | Retention, renewal economics, integration depth, migration difficulty | Churn, easier substitutes, falling renewal prices |
| Network effects | Participation improving customer value, liquidity or matching quality | Multi-homing, declining engagement, a competing network |
| Cost or scale advantage | Sustainable unit-cost advantage and returns through a cycle | Competitors matching costs, excessive capital intensity |
| Brand or intellectual property | Demonstrated pricing power, protected assets, repeat purchase | Price-led competition, expiry, product displacement |
| Distribution or regulatory access | Durable access with documented economic benefits | Channel dependence, lost access, rule changes |

Company disclosures can describe management's claims, but are not automatically independent proof. Cite the filing or source, date, claim type and counter-evidence. Keep source facts, analyst interpretation and assumptions distinguishable. The current repair displays sourced moat evidence only when it can be resolved; it does not manufacture company-specific research.

For identifying promising businesses, evaluate growth quality, per-share economics, reinvestment returns, financing needs and durability together. A fashionable industry or rapid revenue growth is not sufficient. Discovery screens should rank candidates for research, with explicit evidence coverage, rather than certify “future winners.” This discovery pipeline is proposed work.

## Valuation implementation order

The current model router names multiple methods but does not implement and validate all of them. Complete one method against real filings before expanding the advertised coverage.

1. Established cash-generating businesses: dated cash-flow inputs, actual diluted shares, explicit cash/debt treatment, bear/base/bull assumptions, sensitivity, and a documented cross-check.
2. Growth businesses: explicit revenue-to-cash-flow bridge, dilution, reinvestment and financing assumptions. Avoid a generic multiple presented as intrinsic value.
3. Banks, insurers, REITs and infrastructure: separate business-appropriate models. AI infrastructure requires capacity, utilization, pricing, capital expenditure, financing and delivery evidence; it cannot be valued responsibly from a moving average.

Support assumptions as an inspectable scenario tool before permitting automated action. Do not reverse-engineer a “fair value” from the current stock price. Do not fill gaps with invented consensus estimates. Missing methods stay unavailable until implemented and tested.

## Implemented weekly chart study

The October 16 update adds transparent weekly Fibonacci geometry and 50/200-week SMA/WMA, with explicit swing dates, scale selection and dated support-test/hold observations. It also adds the shared light/dark product finish and phone-friendly controls. Read `FIBONACCI_RESEARCH.md`; these chart observations do not alter the canonical recommendation or validate investment performance. Proprietary diamond replication, adaptive DCA and fundamental valuation remain separate work below.

## Diamond signals and DCA

The supplied social screenshot shows colored markers, not an auditable formula or a performance record. AURYN can offer clear markers with its own documented rules; it should not claim to reproduce an unknown proprietary strategy.

Proposed markers must record the inputs, completed-bar timestamp, rule version and trigger reason. Confirmed historical markers cannot silently repaint as future bars arrive. A developing intraday condition must look different from a confirmed signal. Test out of sample and include failed signals, delisted securities where available, spreads, fees and realistic execution assumptions.

Treat a DCA planner as a **budget allocation policy**, not a promise of return. If a user chooses a base contribution of $100, 1× means $100 and 4× means $400 from an already authorized cash budget. It never means leverage or a predicted fourfold gain. Each proposal is bounded by available cash, remaining period budget, maximum position and sector exposure, and thesis/data eligibility. All conditions should produce a visible reason.

Compare adaptive contributions with fixed-schedule DCA using identical starting capital and cash availability, including cash drag. Include drawdown, turnover, concentration and money-weighted results. A higher apparent return obtained by contributing more money is not evidence of a better strategy. No adaptive DCA strategy is added or enabled by this repair.

## iPhone product experience

Keep one responsive web application initially, using the existing Next.js deployment and installable-web-app metadata. A second native codebase would add maintenance cost before the research product is proven.

Keep thumb-accessible primary navigation, safe-area padding, readable numerals, visible focus, reduced-motion support and sufficiently large controls. Apple recommends a 44×44-point hit region for buttons; for this responsive web app, use at least 44 CSS pixels and verify on-device. Financial content should stay on solid, high-contrast surfaces. Translucent navigation is optional and must earn its rendering cost.

On the research page: decision and context first, chart second, deeper business/value/timing evidence available through clear sections. Remember the user's selected section. Avoid repeated full-page spinners, new requests on every tab click, offscreen chart work, and extensive desktop tables compressed into a phone viewport.

Performance targets, not claimed results: real-user p75 LCP ≤2.5s, INP ≤200ms and CLS ≤0.1. Validate on a representative older supported iPhone as well as a recent device, mobile Safari and home-screen mode, with slow-network and large-text tests. Record the actual OS/browser versions used; a narrow Chromium viewport is not a Safari test.

## Cost and scale

Use the current Twelve Data subscription for entitled prices/bars, SEC filings for fundamentals, Supabase for shared research snapshots and private user data, and Alpaca Paper for execution testing. Compute technical indicators from already-fetched bars where permitted instead of paying for separate calls per indicator. Reuse computed company research across users while keeping positions, preferences and broker credentials isolated.

| Work | Proposed refresh approach | Cost discipline |
| --- | --- | --- |
| Visible quotes | Existing session-aware, visible-page cadence | Shared symbol cache, dedupe, honest timestamps |
| Daily/weekly bars | Completed-bar schedule plus bounded interactive refresh | One fetched series supports many indicators |
| Company financials | On new filings; cached between updates | No per-page full SEC download |
| Company thesis/moat notes | When evidence changes | Store cited notes; no language-model call per visit |
| Broad discovery | Small owned/watchlist universe first, then bounded batches | Expand only after measuring cost and data coverage |
| Paper execution | Event-driven intent and reconciliation | Idempotency, bounded retries and audit history |

Preserve the existing 55/minute provider ceiling, background cap of 42, and reserved interactive headroom. Those are existing application settings, not proof of the owner's current purchased entitlement. Budget in the vendor's **weighted credits**, not merely HTTP requests: batching does not automatically make multiple symbols cost one credit.

Illustration only: 20 symbols refreshed once per minute at one credit each consumes 20 credits/minute before chart, retry or background work. The same symbols requested separately by 100 users would imply 2,000 credits/minute without sharing; a valid shared cache can avoid that multiplication. Measure actual cache-hit rate, weighted credits, cache storage, background failures and hosting use before changing plans.

Twelve Data distinguishes individual/internal use from external display and redistribution. Its public support pages describe plan and add-on conditions differently by feed. Check the exact contracted entitlement for a customer-facing launch; caching or using delayed data does not itself grant distribution rights. This is a launch cost to verify, not a recommendation to upgrade now. No paid service was purchased.

## Automation progression

Research → explicit simulated order review → verified paper lifecycle → measured paper automation → separately designed live brokerage product.

Existing paper-mode restrictions remain. Before enabling an automated paper strategy, test stale data, missing inputs, duplicate triggers, partial fills, unknown submissions, cancellations, market closures and reconciliation after restart. Apply per-order and portfolio limits, an audit log and a kill switch. The paper broker's simulation does not model all live-market frictions.

Live auto-trading for the owner and trading for other customers are distinct future projects. They require explicit account permissions, risk controls, operational support, and an assessment of applicable market-data and financial-service obligations. This repair does not place trades or assert that those requirements are met.

## Delivery order and acceptance

1. Repair data correctness, explanations and repeated requests. Verify actual regression cases and mobile layouts. This is the implemented scope of this update; see the dated verification report for exact results.
2. Complete and validate one useful company-research and valuation workflow, including cited moat evidence. Require complete input provenance and reproducible arithmetic.
3. Add a budget-aware DCA simulator and transparent technical signals. Require equal-capital benchmarks and out-of-sample evidence before promotion.
4. Prove automated paper operations. Investment-performance validation and operational reliability are separate gates.
5. Consider customer launch and paid tiers only after actual demand, cost and data rights are known. Consider live trading only through its own explicitly reviewed release.

## Primary references checked for this review

- SEC company facts and submission APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces
- Yandex FY2023 shareholder letter (RUB revenue and divestment context): https://www.sec.gov/Archives/edgar/data/1513845/000151384524000004/yndx-20231231xex99d2.htm
- Nebius reporting entity/divestment note: https://www.sec.gov/Archives/edgar/data/1513845/000155837025005991/R11.htm
- Apple buttons and accessibility: https://developer.apple.com/design/human-interface-guidelines/buttons and https://developer.apple.com/design/human-interface-guidelines/accessibility
- Apple material design principles: https://developer.apple.com/videos/play/wwdc2025/219/
- Web Vitals definitions: https://web.dev/articles/vitals
- Twelve Data use rights: https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage and https://support.twelvedata.com/en/articles/9935903-us-equities-market-data
- Twelve Data weighted credits: https://support.twelvedata.com/en/articles/5615854-credits
- Alpaca paper simulation limits: https://docs.alpaca.markets/us/docs/paper-trading

References describe current public documentation, not the owner's private subscription contract. Proposed refresh and budget policies are design recommendations, not measured capacity guarantees.
