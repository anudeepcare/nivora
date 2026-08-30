# NIVORA V36 — Decision Engine

V36 changes NIVORA from an analysis-first dashboard into a decision-first investor operating system.

## First-glance decision
- Direct action: BUY / START, ACCUMULATE, WAIT FOR ENTRY, BUY BREAKOUT, HOLD, ADD, TRIM, EXIT / REASSESS.
- Horizon-specific levels for Now, Swing and Long term.
- Best entry / DCA zone, breakout-confirm level, Target 1, Target 2 and thesis-break level.
- Planned reward/risk.
- Technical composite score.
- Analyst consensus and analyst target when Finnhub coverage is available.
- NIVORA fair-value range (model estimate, clearly labeled—not guaranteed intrinsic value).
- Plain-English reasons supporting and limiting the call.

## Horizon engine
The horizon selector now changes planning levels and chart context:
- Now: current/daily structure.
- Swing: broader daily/weekly-style structure and wider stops/targets.
- Long term: DCA/accumulation zone, thesis-break logic and longer scenario objectives.

The chart receives the selected horizon's entry, confirm, target and thesis-break levels instead of reusing one set of lines for every horizon.

## Technical simplification
The Technical page now leads with a single composite score (trend + momentum + flow + structure + extension). RSI, MACD, averages, ATR, Bollinger position and other metrics remain available as evidence underneath.

## Analyst + value layer
`/api/context/[symbol]` now requests Finnhub's price-target endpoint in addition to recommendations.
Analyst recommendations are added as a horizon-aware input to NIVORA's synthesis score.

The fair-value range is a NIVORA model estimate using available analyst target, business quality and price structure. It is intentionally labeled as an estimate, not a promise or standalone valuation opinion.

## NIVORA Today / Radar
Today adds a ranked market radar with:
- Best now
- Early momentum
- Quality pullbacks
- In play
- Exit watch

Each candidate shows action, NIVORA score, confidence, entry range, Target 1 and planned R:R before the user opens the full stock thesis.

The starter radar scans a 20-name liquid universe using the existing Twelve Data entitlement. Free-provider limits can cause partial scans; the UI explicitly shows partial coverage instead of fabricating missing rankings.

## Important production notes
1. Keep `TWELVE_DATA_API_KEY` and `FINNHUB_API_KEY` configured server-side in Vercel.
2. SEC 13F continues to use the existing Supabase + GitHub Actions pipeline.
3. V36 does not execute trades. Broker automation should come only after signal persistence/backtesting/paper-trading validation.
4. Price-chart candles are still based on the current market-data feed. V36 changes the chart window and decision levels with horizon, but true intraday multi-timeframe candles require an upgraded/intraday data entitlement.

## Validation performed in this package
- Changed TS/TSX files were syntax-transpiled successfully with TypeScript.
- SEC sync Python file was replaced with the corrected report-period parser.
- A full Next.js build could not be completed in the artifact environment because `npm ci` timed out before the Next.js binary was fully installed. Run `npm install`/`npm ci` and `npm run build` locally or allow Vercel to build before production promotion.
