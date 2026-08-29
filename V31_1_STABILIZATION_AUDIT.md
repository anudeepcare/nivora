# NIVORA V31.1 — Stabilization + Feature Audit

## Fixed in V31.1
- Removed the stray `← Today` link from stock analysis pages.
- `Open full thesis →` now selects the Thesis tab and smooth-scrolls to the research/thesis section on desktop and mobile.
- About, Terms, Privacy and Disclaimer now preserve the authenticated experience: signed-in users get `← Back to NIVORA` and return to `/dashboard`; signed-out users return Home.
- Legal/info navigation does not call `signOut()`. The only explicit auth mutation in the main shell remains the Log out button.

## Verified live in source
- Simple / Investor / Pro depth modes.
- Horizon modes: Now / Swing / Long term / I own it.
- NIVORA Intelligence synthesis with business, valuation, trend, timing/entry, momentum, flow, catalysts, derivatives and risk dimensions.
- Contradiction detection, confidence/evidence coverage, next-decision trigger and thesis explanation.
- Price map with support, preferred entry, resistance, breakout and invalidation levels.
- Technical Lab with trend, momentum, flow, structure, RSI, MACD, extension, relative strength and market regime.
- Options Lab / derivatives research foundation and provider registry.
- Watchlist, portfolio, alerts, profile, About/FAQ, Terms, Privacy and Disclaimer.
- Validation/audit architecture from V29/V30 remains in the project.

## Foundation exists, but should NOT be marketed as full institutional data yet
- Flow: currently quantitative price/volume participation evidence; it is not a licensed institutional order-flow/whale feed.
- Derivatives: options intelligence exists, but quality/coverage depends on the connected provider entitlement.
- Gamma/positioning: architecture/proxy support exists; this is not equivalent to a full real-time dealer-gamma feed.
- Valuation: engine dimension exists; depth depends on standardized fundamental coverage.

## Still missing as true data-backed features
- Institutional ownership dashboard (13F holders, ownership %, QoQ changes, new/exited positions).
- Insider transaction intelligence beyond whatever current news/filing evidence happens to surface.
- Whale accumulation/distribution based on a dedicated institutional/flow feed.
- Dedicated quant-agent research page with factor attribution and historical percentile context.
- Elliott Wave labeling/targets with confidence and invalidation.
- Explicit DCA-zone engine (current support/preferred-entry levels are not yet a portfolio-aware DCA model).
- Rich buy/sell signal overlays sourced from external social/X personalities. These require permitted/licensed data access and should not be scraped.
- Full backtested proof of predictive edge. Validation plumbing exists, but performance claims require accumulated out-of-sample results.

## Recommended next build order
1. Keep V31.1 stable and deploy it.
2. Institutional Ownership / 13F intelligence using permitted SEC/public filing data and normalized holder changes.
3. Quant Lab: factor attribution, relative strength, regime, quality/value/growth/momentum percentiles.
4. Accumulation engine using price/volume first; upgrade to licensed flow when available.
5. Advanced structure: DCA zones + scenario map; Elliott Wave only as a secondary probabilistic overlay.
6. Improve derivatives/gamma when a stronger licensed options feed is purchased.
7. Accumulate forward-validation history before making any outperformance claim.
