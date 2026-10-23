# Alpaca options connection

This release defaults Options to Alpaca instead of the unauthorized EODHD add-on. It does not purchase a plan or submit trades.

## Vercel production variables

- `AURYN_OPTIONS_ENABLED=true`
- `AURYN_OPTIONS_PROVIDER=alpaca`
- `AURYN_ALPACA_OPTIONS_FEED=indicative`
- Existing `ALPACA_PAPER_API_KEY` and `ALPACA_PAPER_API_SECRET` from the same paper account, server-side only.

Redeploy after changing variables. No new database migration is required.

Indicative quotes are modified, and trades are delayed. They are not executable OPRA quotes. Do not select `opra` unless the account has that entitlement. Personal account access does not establish commercial redistribution rights; retain the existing access controls and verify those rights before customer display.

## Included

Authenticated chain snapshots, contract metadata join for dated open interest, strike/expiry estimated gamma heatmap, existing GEX/profile/chain/LEAPS/strategy views. Missing daily volume is left missing; latest trade size is never used as daily volume. Open interest older than seven days, undated or future-dated is excluded. Latest quote date is retained even when a newer trade exists. Adjusted contracts remain excluded from standard payoff models.

Snapshot and metadata pagination each stop at four pages of 1,000 entries. Partial chains are labeled and withhold full-chain gamma-flip calculations. Metadata failures do not erase usable quotes; affected GEX remains unavailable. Response cache is five minutes per warm server instance with concurrent request coalescing and a 100-entry bound. This is not a durable cross-region cache or a streaming feed. Selected-expiry requests reduce load. There is no automatic paid-feed fallback.

## Verify after deploy

1. Sign in with an account allowed to use Options. Open APP or SPY → Options.
2. Confirm the indicative-feed disclosure, expirations and actual bid/ask rows.
3. Select another expiry and check that its contracts change.
4. Check OI/GEX coverage. Missing source inputs must show unavailable, not zero.
5. Inspect a strategy payoff as an indicative scenario, never an executable quote.
6. If access fails, check the server environment key pair and the Alpaca account's data permissions. Never paste secret keys into chat.

## Verification limits

Local automated checks use synthetic provider responses. The production Alpaca credentials were not available in this workspace; actual account entitlement and returned chain coverage have not been verified. No live trade or payment was made. Prior component visual reports refer to the previous EODHD-only build; this release adds a horizontally scrollable heatmap and an empty-chain state.
