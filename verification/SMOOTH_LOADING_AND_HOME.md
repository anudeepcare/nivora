# Search, cached loading, Home and footer

- Search debounce reduced from 350 to 200ms, keeping request deduplication, stale response suppression and keyboard navigation.
- Shared resource hook exposes the matching account cache immediately when its key changes and retains stale data while refreshing. It never borrows another symbol/account response. New cache regression passes.
- Bear/base/bull sensitivities expanded by default. Analyst targets remain separately labelled and existing currency/share/period guards remain.
- Home uses owned instruments when watchlist is empty. Defined surfaces distinguish holdings context and radar; no hardcoded stock recommendations.
- Desktop content uses a flexible column so short-page footer occupies the bottom of the content area. Mobile retains document scrolling and dock clearance.
- 176 tests, TypeScript, production build and 64 built API fixture checks pass. Archive CRC and manifest checked during packaging.

No rendered browser performance measurement or installed-iPhone verification was performed. No claim of buttery smooth or permanent PWA resolution is established by these source tests. No deployment performed. Broader agreed capabilities remain outstanding; see docs/DATA_COVERAGE_REVIEW.md. Previous metrics/feed changes are included in the full source.
