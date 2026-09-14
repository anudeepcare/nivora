# AURYN V9.9.9 — Multi-Account Portfolio Intelligence

## Multi-account holdings
- Position identity is now user + account/broker + symbol.
- Existing holdings migrate automatically to `Default`.
- Same symbol can exist at Robinhood, Moomoo, Fidelity, etc. without overwrite.
- Main holding aggregates quantity and weighted average cost.
- Expand ACCOUNTS to edit/delete an individual broker lot.

## Performance and analytics
- Existing actual daily snapshot system remains the source for 1D/1W/1M/3M/6M/YTD/1Y/ALL.
- Snapshot rows now preserve invested value, cash, cost basis and unrealized P/L.
- Performance tab stays accessible and explains when a requested period lacks enough real history instead of appearing broken.
- No historical values are fabricated.
- Capital Queue now ranks by action severity + portfolio weight + concentration + evidence instead of action label alone.

## Performance
- Duplicate symbols across brokerage accounts are deduplicated before the batch canonical market request.
- One market snapshot is reused for all lots of a symbol.
- V9.9.8 Market Price Authority remains the current-price source.

## Database
Exactly one migration is required:
`supabase/migrations/20260914110000_auryn_v999_multi_account_portfolio.sql`

Run the complete file once in Supabase SQL Editor before using multi-account Add/Edit.

## Unchanged
- CIO formulas/thresholds.
- V9.9.8 Market Price Authority.
- V9.9.7 autonomous workflows.
- `vercel.json = {}`.
