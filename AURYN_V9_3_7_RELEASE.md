# AURYN V9.3.7 — Premium Decision UX

## Research
- Provider logo first, broad ticker-logo fallback second, deterministic initials fallback last; broken image state is hidden.
- Optional Market Cap, Volume, 52W High/Low, sector/industry/exchange appear only when backed by available data.
- Denser first screen with Current Price, Opportunity, Entry Quality, Confirm distance, Reward/Risk, Evidence Quality, T1 upside and invalidation downside.
- Distinct premium semantic hero backgrounds for constructive, neutral and defensive actions.
- Decision ladder (Entry → Confirm → T1 → T2) and Risk ladder (Support → Major Support → Invalidation).
- Metric help explains how to read non-obvious scores and what they do/not mean.
- Bull/Base/Bear retains decision-grade values and adds current-price deltas when computable.
- Evidence tabs now switch and automatically scroll to the evidence surface.

## Portfolio
- 1D/1W/1M/3M/6M/YTD/1Y/2Y/3Y/4Y/ALL stay selectable and are calculated from real stored snapshots.
- If requested history predates stored snapshots, AURYN reports the actual available start date instead of fabricating performance.
- Capital Queue ranks non-HOLD actions by urgency and portfolio impact.
- Holdings add Current Price, P/L %, Weight, timeframe chips and Next Trigger.

## Performance
- Below-fold evidence, portfolio queue and holdings use browser content-visibility containment where supported.
- Existing warm-cache/canonical decision reuse remains unchanged.

## Safety / Truth
- One canonical AURYN decision brain.
- No fabricated prices, probabilities, fundamentals or portfolio history.
- Paper/live trading boundaries remain explicit.
