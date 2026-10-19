# Advanced feedback coverage — October 19

This is an explicit implementation inventory, not a claim that the full pasted roadmap is finished.

## Shipped in this patch
- Mobile section links no longer shrink or clip; they wrap into readable full-label pills. Intro spacing is reduced.
- Disconnect panel: price relative to 50-MA, closing drawdown, realized volatility, comparable revenue/FCF growth and interest coverage, with a counterargument. Uses reported inputs; does not rank unobserved explanations or issue a fabricated divergence score.
- Annualized log-return realized volatility at 10/30/90 observations, Parkinson high/low volatility at 20 observations, historical one-day 95%/99% VaR and Expected Shortfall. VaR uses a linearly interpolated sample quantile, ES averages fixed worst-tail probability mass using fractional boundary weighting. 95% requires 60 returns; 99% requires 250. These minimums are not statistical precision guarantees.
- Current closing drawdown and duration; frequency of absolute >3% overnight gaps; same-day fill rate with qualifying event count (minimum five); best/worst daily and worst rolling-five-session returns.
- 20/50/100/200 close averages; five-observation slope of 20-MA; additional 5/120/one-year momentum; z-score, %B, stochastic %K, positive-session share, distances from full-year high/low.
- Chaikin money flow, 20-observation OBV change and up/down volume ratio; descriptive return skewness/excess kurtosis.
- Classic reference pivot levels from the latest completed OHLC bar. Existing Fibonacci/VWAP studies remain.
- Planner: user-assumed win probability, breakeven rate, expected dollar P&L, position/capital percentage, position/typical daily traded value, absolute observed-gap-down stress and P&L at stop/target/±1/2 ATR. One-click ATR invalidation presets use the user's entry. No execution/order submission.

## Not shipped — implementation or entitlement still needed
- Market/sector relative strength, beta/correlation, factor regression and macro regime/breadth. Requires aligned benchmark/universe series and validated mappings.
- Industry percentile ranks and complete peer comparisons. Selected examples do not establish industry coverage.
- Options IV/rank/skew/term structure, Greeks/GEX, put/call, expected straddle move, borrow costs and short-interest history. Current data entitlement has not been verified; ordinary OHLC bars cannot supply these.
- Tick-based volume profile/POC/value area, intraday relative volume, bid/ask impact or genuine order flow. Daily volume is not allocated into invented price bins.
- ADX/DMI, systematic divergence detection, confirmed-pivot/zigzag selection and clustered support zones; multiple event VWAP anchors; unfilled-gap tracking.
- Complete historical valuation distributions, sector-specific ROIC/quality/distress models, Piotroski/Altman/Beneish and estimate-revision time series. Required comparable inputs and applicability rules must be validated first.
- Conditional backtests, analog outcomes, seasonality and public signal scorecard. No fabricated match counts, hit rates or percentile return fans.
- Portfolio correlation/heat, short-side or options planners, Kelly sizing, automatic execution and decision lifecycle journal. Previously requested removal of personal journal/export remains respected.
- Persistent module presets, alert creation from every metric, cross-device desk notes, grounded natural-language screener and public sharing/export are not included.

## Data and UX limits
All added studies reuse supplied completed daily history, excluding the retrieval calendar date. No new provider endpoint calls or fees are introduced. Corporate action/volume adjustments are not independently audited. News sentiment, causal explanations and institution identities are never inferred from volume. Financial dates can differ materially from price dates; the UI states this. Gap stress is an assumption, not a worst-case bound. Expected P&L uses user input, not an estimated win probability.

228 automated tests, TypeScript and production build are recorded in verification/professional-advanced-verify.log. No physical iPhone or browser visual acceptance is claimed. Existing PWA shell geometry is unchanged; no paid access gate is activated.
