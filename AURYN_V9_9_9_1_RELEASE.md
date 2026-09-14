# AURYN V9.9.9.1 — Consolidated Portfolio Cockpit

## Corrected holding behavior
AURYN no longer exposes brokerage/account tracking. One symbol is one consolidated portfolio holding.
Adding an existing ticker adds the incoming shares and recalculates weighted average cost. It does not overwrite the existing quantity/cost.
If experimental V9.9.9 account rows already exist for the same symbol, the next add collapses them into one holding automatically.

Example:
- 2,400 IREN @ $44.74
- add 300 IREN @ $49.39
- result: 2,700 IREN @ ~$45.26 weighted average

## Locked Portfolio Cockpit UX
Implemented the approved mobile-first hierarchy:
- Portfolio value + Total P/L + Invested + Cash + Health
- Portfolio Performance with 1D/1W/1M/3M/6M/YTD/1Y/ALL
- Portfolio / SPY / QQQ chart using actual stored snapshots
- When requested history predates tracking, show all available actual history with an explicit tracked-history message rather than a dead N/A-only experience
- What needs attention?
- Portfolio Opportunity Map
- Portfolio Drivers: top gainers and top drags
- Allocation & Risk
- concise Capital Queue
- portfolio health methodology remains available

## Performance
Unique ticker symbols are deduplicated before the existing batch canonical request. Duplicate lots never trigger duplicate market-data loads.

## Mobile
Single-column card hierarchy below 760px, horizontally scrollable period/navigation controls, compact four-metric first screen, responsive charts, no desktop table dependence for the cockpit.

## Database
No new SQL and no new Supabase migration is required.
The implementation is compatible whether or not the experimental V9.9.9 account migration was previously run.

## Preserved
- V9.9.8 Market Price Authority
- CIO formulas and thresholds
- V9.9.7 autonomous workflows
- vercel.json remains {}
