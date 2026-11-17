# Advanced research tab

## Implemented
Advanced is a lazy-loaded Research tab for equities and crypto, using the current report and supplied completed daily history. It adds no new provider requests.

- Setup: 20/60-observation price momentum, simple 14-TR ATR percentage, relative volume, 20-close Bollinger bandwidth, average traded value, largest observed overnight gap and daily downside deviation. Existing annualized volatility, drawdown and MACD context is included.
- Levels: last-63-observation extreme anchors, ordered pullback/rebound Fibonacci ratios 0/.236/.382/.5/.618/.786/1. Daily typical-price VWAP anchored to the window low is a disclosed approximation, only with valid positive volume.
- Long-only hypothetical planner: editable capital, risk budget, entry, invalidation, target and each-side slippage. Whole-unit position size respects both capital and risk limits; reports planned loss and net reward/risk. No orders, shorting, leverage, guaranteed stop execution or personal account inference.
- Business: expandable calculation definitions for supplied cash quality, financial health, shareholder economics and growth, plus financing/working-capital context. Financial amounts use statement reporting currency. Crypto does not receive company fundamental panels.
- Expectations: existing editable cash-flow and reverse-valuation sensitivities with eligibility guards.
- Evidence strip connects business risk flags to price momentum without creating an uncalibrated Buy/Sell rating.

## Boundaries
No options/gamma, short-borrow/order-book feeds, automatic institutional-flow inference, benchmark-relative strength/beta/correlation, whole-portfolio risk attribution, sector-wide ranks, ADX or strategy/backtest lab are shipped in this increment. Those require additional implementation and appropriate historical/entitled data. No premium entitlement or billing has been activated.

Price studies exclude the report's calendar date conservatively, even when that day's close may be settled. Daily history can contain corporate-action/volume inconsistencies; split reconciliation is not independently audited by this module. An observed window extreme is not a confirmed discretionary swing pivot. Missing data is withheld rather than synthesized. See calculation disclosures in the UI.

## Verification
223 automated tests passed, including deterministic filtering/OHLC guards, insufficient data, Fibonacci direction, ATR/relative-volume arithmetic and slippage-aware risk sizing. TypeScript and production build results are recorded in verification/advanced-verify.log. Browser visual acceptance and physical iPhone verification remain outstanding. No production data writes or trades performed.

## Professional expansion
See ADVANCED_FEATURE_COVERAGE.md for the full pasted-feedback implementation matrix and pending datasets. New risk/participation studies, Disconnect evidence panel, classic pivots and dollar-based planning stresses are included. The mobile navigation now wraps without compressing labels. The updated verification log is verification/professional-advanced-verify.log (228 tests).
