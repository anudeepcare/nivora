# Weekly Fibonacci research

Implemented October 16, 2026. Open a stock → Technicals → Weekly structure. The same study is available inside Overview → Weekly structure & supporting evidence; “Fib & weekly” opens Technicals directly.

## What the user gets

A weekly candlestick chart with selectable Fibonacci retracements, 50/200-week moving averages, optional conditional extensions, automatic or manual swing anchors, linear/logarithmic scale, an expanded chart and plain-language context. The explanation names the last completed weekly close, nearest mapped lower candidate, first higher level to reclaim, selected swing failure, and whether a test or subsequent hold was observed. Dated anchor prices and a precise numeric table make the calculation inspectable. Advanced methodology stays collapsed by default.

Preferences persist per symbol for the browser session. The overview study mounts only when expanded; its expanded dialog chart mounts only when opened. All studies reuse the existing cached five-year daily-history request. No new provider, subscription, per-indicator request, database migration or broker operation is introduced.

## Calculation contract

- Input dates and positive finite OHLC values are validated. Inconsistent bars are excluded. Same-day revisions use the last valid supplied observation without doubling volume.
- Daily bars are sorted and grouped into UTC Monday calendar weeks, including across year boundaries. The entire current calendar week is excluded, even after Friday close. This deliberately conservative boundary differs from platforms that include a developing weekly candle.
- A weekly average requires exactly 50 or 200 consecutive calendar-week observations. Gaps are not filled and short histories are not substituted. SMA weights every close equally. WMA weights from 1 for the oldest to N for the newest close.
- Automatic anchors select the latest ordered opposite strict pivots, each with two consecutive completed weeks on either side. A bar that simultaneously meets high/low pivot conditions is ambiguous and excluded. The confirmation availability date is shown. New confirmed pivots can change the selected swing.
- Manual anchors use the chosen weeks' extremes: low→high for an upswing, high→low for a downswing. The start must precede the end and the price direction must match. Invalid choices withhold Fibonacci levels and explain why.
- Retracements use 23.6%, 38.2%, 50%, 61.8% and 78.6%. The 50% level is a common convention, not a Fibonacci ratio. In linear coordinates, a retracement is `end + (start - end) × ratio`. Logarithmic mode performs the same geometry in log-price coordinates and displays a logarithmic chart.
- Conditional two-anchor extensions use 127.2% and 161.8%, `start + (end - start) × ratio`. They are off on the chart by default. Nonpositive/nonfinite projections are omitted. These are not three-point projections, Elliott-wave labels, valuation targets or forecasts.
- Levels within 1.5% of the lowest price form a display zone. Fibonacci and moving-average overlap is labelled as overlap, not independent evidence or a probability score.
- A test is a completed weekly bar that intersects a zone and closes above its high. A two-week hold additionally requires the next consecutive week to remain above its zone low and close above its high. For moving-average zones, each week's own average value and overlap are required; today's average cannot manufacture a prior test. Missing prior values withhold the hold claim.
- Observation rules only run after the anchor's availability boundary (conservatively, weeks beginning strictly after that boundary). They describe a dated pattern; they are not a validated prediction model or an order instruction.

## Evidence limits

The study labels its actual historical cutoff. History older than 14 days gets a prominent stale warning. OHLC data alone cannot certify complete exchange-session coverage, split/dividend adjustment consistency or missing days within a supplied week. First/last provider weeks may be partial. Other platforms may use different adjustments, swing anchors, sessions and scales, so identical levels are not promised.

The CIFR/CRM/ADUR images supplied by the owner are retained as references under `docs/redesign/`. Their quoted prices are not inserted as current market data. The equity-brief reference informs the distinction between chart timing and business evidence; it does not supply company facts or validate a fair-value model.

This module does not change the canonical investment action, moat assessment, valuation, position sizing or paper-trading authorization. Original roadmap/engine functions elsewhere remain preserved; this is a separately inspectable research study. No claim of trading advantage, guaranteed support, near-perfect decision accuracy, live-money automation or exact replication of a proprietary social-media strategy is made.

## Verification

See `verification/WEEKLY_UX_REPORT.md`, the current test manifest and browser harnesses. Core tests cover invalid and future data, calendar boundaries, pivot availability, manual direction, exact average lengths, gaps, linear/log formulas, presentation states and overlay toggles. Browser checks exercise controls, invalid anchor choices, modal dismissal, per-symbol settings and request reuse. They use synthetic data, not current CIFR prices.

## Primary references

- Fidelity, Fibonacci retracement: https://www.fidelity.com/learning-center/trading-investing/technical-analysis/technical-indicator-guide/fibonacci-retracement
- TradingView, Fibonacci drawing tool and logarithmic option: https://www.tradingview.com/support/solutions/43000518158-fibonacci-retracement-drawing-tool/
- TradingView, separate three-point extension concept: https://www.tradingview.com/support/solutions/43000518137-trend-based-fib-extension-drawing-tool/
