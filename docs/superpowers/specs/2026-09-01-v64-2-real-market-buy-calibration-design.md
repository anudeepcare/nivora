# NIVORA V64.2 — Real-Market BUY Calibration Design

## Problem
V64.1 proved the BUY branch was synthetically reachable, but the user observed 100+ real analyzed tickers resolving to WAIT / NO ACTION / AVOID, including names that appeared to have constructive fundamentals and market structure. A synthetically reachable branch is insufficient if realistic upstream score distributions almost never satisfy it.

## Design
1. Replace the single global new-money threshold intersection with archetype-specific BUY pathways.
2. Preserve absolute safety gates: vetoes, broken/bearish thesis, weak/overextended timing, falling-knife stabilization, high fast-warning risk, severe market/model disagreement with fragile valuation, and consistency failures.
3. Allow high-quality compounders to qualify for a starter BUY with acceptable—not perfect—timing when fundamentals, opportunity, financial quality and stabilization are strong.
4. Let cyclicals/financials/growth/pre-scale names use evidence appropriate to their archetype instead of forcing the same valuation/timing requirements on every company.
5. Persist the selected BUY path, tier, exact blockers and closest path in TodayDecision so live UI, snapshots, paper trading and backtests see the same policy.
6. Add a real-market decision audit from latest V64.2 snapshots and a standalone distribution-audit script.
7. Extend point-in-time backtests to measure BUY cohorts and individual BUY pathways separately.
8. Never tune toward a desired BUY percentage. Historical/OOS/forward outcomes determine whether a path deserves trust.

## Acceptance
- BUY/ADD/WAIT/HOLD/TRIM/SELL/AVOID/NO ACTION remain reachable.
- Strong compounder can qualify with timing score around 50 when stabilization is confirmed.
- Growth path can qualify without absolute valuation when valuation is legitimately unsupported.
- Falling-knife / high early-warning / hard-veto states remain blocked.
- Every WAIT exposes exact closest BUY path and blocker.
- Trading Lab displays actual BUY distribution from real V64.2 snapshots.
- Backtest report separates BUY performance from overall scoring performance.
