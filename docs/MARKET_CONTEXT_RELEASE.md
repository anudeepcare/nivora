# Benchmark, peer context, segments and Technicals

## Working UI and calculations
- Advanced has on-demand benchmark comparison using the existing chart API and five-year cache. Broad-market and sector ETFs are selectable; a reported-sector mapping offers the relevant sector ETF. Crypto can compare BTC/USD or ETH/USD. USD-quoted instruments only; no FX attribution.
- Date-aligned 20/60/120-observation price returns and excess percentage points; 60/252-observation beta/correlation; 60-observation R² and a rebased relative-price line. At least 61/253 shared closes are needed for regression. Flat benchmark variance and insufficient/stale history withhold the result.
- Automatic industry candidates use the documented screener endpoint and an industry classification loaded on the server. If no industry candidate is returned, a sector screen is attempted. Up to five nearest sizes are selected from the largest 25 supplied US listings, with duplicate/current symbols excluded. The selection is biased toward larger available companies and is not a validated competitor set or industry percentile universe. Clicking a candidate loads its report into the existing comparable-metrics table, up to six companies total.
- Revenue segments use the documented SEC company segments endpoint. Product/service and geography stay separate; periods, currency units and concepts remain visible. Conflicting duplicate groups are withheld. No totals, mix percentages or growth are inferred without duration/reconciliation metadata. Single-segment, unsupported or unauthorized datasets can be empty/unavailable without breaking core research.
- Benchmark loads are requested explicitly; peer and segment requests are cached for a day. Additional uncached history/discovery/segment requests consume existing data allowances. No new subscription is purchased and access is not presumed.
- Technicals has a dedicated aligned desktop/mobile layout: summary, Trend, Momentum, Volatility/range, Participation, then price levels. Includes moving averages/distances, EMA, Wilder ADX/DI and ATR, RSI, MACD, stochastic, momentum windows, %B/bandwidth, z-score, drawdown, CMF, OBV change, relative volume, traded value, Fibonacci, anchored daily VWAP and classic pivots. Formulas expand under labels. DCA is no longer repeated in this tab; its Overview context remains.
- Advanced also has a single-ticker historical price-condition study. A signal uses the return observed at that close, entry at next open, exits at 5/20/60th holding closes and two-sided assumed costs. Signals are separated by 60 observations, and each horizon reports its own completed/pending sample, median, mean, 10th/90th sample quantiles and positive share. This is not a validated strategy, multi-feature analog engine, fundamental backtest or estimate of future win probability. Selected-ticker survivorship/selection, tuning/overfitting and corporate-action limitations are explicit.
- PostCSS is now an explicit pinned dev dependency rather than a test relying solely on Next's transitive dependency. Install with npm ci --include=dev before verification.

## Primary endpoint contracts used
- https://eodhd.com/financial-apis/stock-market-screener-api
- https://eodhd.com/financial-apis/sec-company-analytics-api

Endpoint code and fixtures implement the documented contracts. Live subscription authorization is not verified here. The SEC segment endpoint can return 403 when a plan lacks access. No failed optional dataset is represented as completed coverage.

## Verification
239 tests and production/type checks are recorded in verification/market-context-verify.log. API fixture checks are in verification/market-context-api.log, including auth rejection, bounded peer discovery/cache, documented segment normalization, denied entitlement and crypto rejection. No real paid calls, live database writes or physical iPhone/browser visual acceptance were performed.

## Still pending from the larger approved roadmap
Cited original-filing passage AI and automated thesis checking; complete transaction-based outcome review; licensed options analytics; brokerage OAuth; TOTP enrollment/recovery and enforcement; Stripe checkout/portal/webhooks/entitlements; validated point-in-time backtests and historical analog models. This release does not claim these are finished.
