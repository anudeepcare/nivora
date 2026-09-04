# NIVORA V65.9 — Reliability + Premium One-Glance UX

## Functional reliability
- Paper equity limit orders are normalized to two decimal places before Alpaca submission.
- Alpaca execution quotes use the freshest quote/trade timestamp so an older last trade cannot make a fresh quote look stale.
- During the regular session, stale/delayed paper execution data gets one automatic refresh before a safe block.
- Alpaca latest quote/trade calls have bounded timeouts.
- Analyze requests optional Alpaca historical-integrity bars in parallel with Twelve Data instead of serially delaying the core result.
- Stock analysis automatically retries the core analysis once before showing a fatal error.

## UX
- User-facing quote status uses plain language such as “Market open · Live data”.
- 6M / YTD / 1Y is a compact segmented control.
- Top market context is one quieter summary surface with reduced divider weight.
- Metric info icons are locked inline immediately beside metric labels.
- Metric help shows plain-English score interpretation and available score contributors.
- Risk Pressure is interpreted inversely: higher is worse.
- Portfolio summary decorative underline bars are removed.
- Navigation/header styling is tightened for a more website-like presentation.
- Trading Lab exposes the risk/execution stage between BUY signals and submitted paper orders.
- Stale quote blocks are translated into user-facing language.

## Safety
No scoring weights, BUY thresholds, thesis thresholds, or live-money execution permissions were relaxed.
Alpaca remains paper-only.
