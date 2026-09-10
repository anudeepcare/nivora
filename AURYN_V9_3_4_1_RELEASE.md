# AURYN V9.3.4.1 — Reliability & Performance Hotfix

## Milestone
Make stock research resilient under real provider latency: fast confirmed decision loading, non-blocking tactical context, no full-page collapse on transient history failure, and a corrected real-world audit.

## Key changes
- Core decision path now fetches confirmed 4H + 1D and derives 1W without waiting on 15M data.
- 15M/1H tactical context loads independently after the confirmed decision is available.
- Temporary provider timeouts are reported as `PROVIDER_TEMPORARY_FAILURE`, not fake `MARKET_HISTORY_UNAVAILABLE` coverage failures.
- Browser performs one bounded core analysis request; server-side daily history handles the bounded retry.
- Previous verified analysis is reused from session cache while refresh happens in the background.
- Core confirmed analysis refreshes every 5 minutes; live quote remains independent and refreshes faster.
- QQQ/other symbols no longer collapse to a blank error page when one history request fails.
- Live audit fixes `null -> 0` false positives and accepts signed -100..100 technical consensus scores.
- Golden symbols are always included before diversified audit symbols.
- 15M/1H live-context coverage is audited through the separate tactical endpoint.
- Cross-surface price comparison only runs when snapshots/timestamps are actually comparable.
- Decision UX separates the technical tape from the investment action and groups Market Plan / Decision Logic clearly.

## Release status
`CODE_READY_LIVE_VALIDATION_REQUIRED`

Run Golden/30-symbol deployed validation before 100/500.
