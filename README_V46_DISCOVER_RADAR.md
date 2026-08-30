# NIVORA V46 — Discover Radar + Today Change Feed

V46 fixes the scanner warm-up/ranking issue exposed when Discover showed mostly A-prefixed securities.

## Changes
- Stable hash-ordered rolling scan instead of alphabetical batches.
- Rejects warrants, units, rights, preferred-like suffixes and unknown instrument types from the default universe.
- Default investability pre-screen: price >= $3 and 20-day average dollar volume >= $2M (configurable).
- Discover ranks persisted fresh results across all symbols already scanned; it never treats the current batch as the recommendation list.
- Coverage now counts actual fresh rows in `nivora_market_scan`, not universe size.
- Today becomes a real change feed: action changes / >=6-point rank changes from symbols with a prior observation.
- Initial scanner warm-up does not masquerade as "Today changed".

## Required migration
Run `supabase/migrations/20260830_nivora_v46_discover_today.sql` once.

## Optional GitHub Environment variables
- `NIVORA_MIN_PRICE` default `3`
- `NIVORA_MIN_DOLLAR_VOLUME` default `2000000`

Existing V45 scanner secrets remain unchanged.
