# AURYN V9.9.9 Portfolio Intelligence Design

## Goals
- Multiple brokerage/account positions for the same symbol without overwrite.
- Aggregate account lots into one portfolio-level security view with weighted average cost.
- Persist account-aware daily portfolio snapshots and cash-flow adjustments for truthful period performance.
- Make 1D/1W/1M/3M/6M/YTD/1Y/ALL useful when actual history exists; never fabricate missing history.
- Improve first-screen portfolio metrics, charts, Capital Queue usefulness, and load performance.
- Use V9.9.8 Market Price Authority for current valuation.

## Data model
`portfolio_positions` gains `account_name` (default `Default`). Uniqueness becomes `(user_id, account_name, symbol)`.
Existing rows migrate to `Default`.
`nivora_portfolio_snapshots` gains invested/cash/cost/unrealized and account-aware holdings payload support. Existing snapshot rows remain valid.
`nivora_portfolio_cash_flows` records deposit/withdrawal/transfer adjustments for future time-weighted performance integrity.

## UX
- Add/Edit position includes Account/Broker.
- Holdings aggregate same-symbol lots; expandable account breakdown.
- Edit/delete operates on the individual source row.
- Performance chart uses actual stored snapshots and selected period.
- Drivers, Allocation, Risk views expose useful portfolio questions rather than decorative charts.
- Capital Queue prioritizes severity, weight, evidence, concentration and trigger proximity.

## Performance
- Deduplicate symbols before batch canonical request.
- One batch market request for portfolio holdings.
- No per-row polling loops.
- Stable calculations memoized client-side.

## Safety
No CIO formula/threshold changes. No V9.9.8 market-price-authority changes. No V9.9.7 automation changes.
