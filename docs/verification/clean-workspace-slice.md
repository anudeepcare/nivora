# Clean workspace presentation slice

## Owned surfaces

- Home: greeting, briefing, daily holdings, source coverage, destinations, saved company rows, events, news, research inbox and radar containers.
- Research entry: search, saved-company history cards, quote/error/empty states and saved-company pagination.
- Portfolio: balance summary, market comparison chart controls/legend, assessment, holdings, scenarios, allocation/exposure containers, toolbar, ledger and native dialog framing.
- Watchlist: heading, filters, company table, search and existing review controls.
- Auxiliary HomeBriefing/HomeUpdates/PortfolioCharts: dedicated scoped styles rather than retired dashboard selectors.
- Settings: retained its pre-existing single scoped SettingsPage owner; account mutations unchanged.

## Changes

The layered Home/Portfolio/Watchlist styles were replaced, not supplemented. Home now puts a compact dated saved-company table beside events at desktop width. History is available through a bounded dialog. Research keeps the original company chart functionality with a clean independent stylesheet. Portfolio uses a two-column chart/assessment first row and full-width holdings before scenarios. Mobile follows document order and allows the complete holdings table to scroll rather than silently deleting columns. Financial series, totals, quantities, requests, validation and account handlers were not rewritten.

## Evidence and limits

Tests render actual saved-company markup for dated, stale, unavailable and future-invalid quotes, deduplication and history triggers. Existing Home/portfolio/watchlist/settings behavioral tests remain the basis for retained data/control behavior. Source CSS checks cover primary grid order, independent screen ownership and control sizes. No screenshot/browser fidelity claim: this environment's prior browser restriction remains, and no bypass was attempted. Full app integration, live authenticated states and visual checks remain the parent's release gate.

Native secondary detail controls in older auxiliary Home/Portfolio components were not converted in this bounded task. Their content is preserved. Settings was reviewed rather than rewritten merely to create a diff.
