# AURYN final independent review

Read-only source review against HEAD, performance-first plan, and current execution ledger. No source edits or deployment.

## Important

1. Global analytics consent styling is lost on standalone public pages.
   - `app/layout.tsx:9` no longer imports compatibility.css; `components/Product.tsx:2` now owns that import.
   - `AnalyticsConsent` remains mounted by the root layout and emits `analytics-consent` / `consent-actions` (`components/AnalyticsConsent.tsx:172`), whose only CSS definitions are in `app/core/legacy-panels.css:38901` and its mobile override at 39071.
   - Direct navigation to `/about`, `/pace`, `/portfolio-check`, or `/track-record` does not mount Product. Consequently a new visitor's consent panel loses fixed placement, container appearance, sizing and responsive action layout and falls after the page content. This can be missed when testing after navigation from a Product route with its CSS already loaded.
   - Fix: move the consent-specific CSS to a globally imported small stylesheet or a CSS module imported by AnalyticsConsent. Verify fresh direct public-page loads with no saved consent, including mobile.

## Minor

2. Invalid research tab query produces a blank Snapshot instead of the intended fallback.
   - `components/Research.tsx:229` resolves an unknown `?tab=` value to `Snapshot`, but the new retained-panel initializer at lines 256–261 uses the unvalidated raw query and returns an empty array for an unknown value.
   - The newly added guard at line 643 then suppresses DecisionOverview/FreeSnapshot even though Snapshot is selected. The query synchronization effect also ignores invalid values. Repro: open a company route with `?tab=bogus` or `?tab=Labs` (Labs is a visible label, not an internal tab).
   - Fix: initialize retainedCharts from the resolved initial `tab` (also covers cache-restored chart tabs), and add a fallback-query regression test.

## Verified / limits

- 12 focused resource-cache, handbook-reader, and research-receipt tests passed with Node strip-types.
- Resource-cache guards correctly prevent invalidated requests and cleared-account requests from repopulating the cache. Account provider is keyed by account ID, preventing retained hook state across accounts.
- AST-level function comparisons with whitespace normalization confirmed identical primary Overview/HomeOverview/Portfolio/HoldingsTable/Watchlist/SearchDialog/ResearchHome bodies and identical useWorkspaceQuotes body after extraction.
- Receipt export only receives public company metadata and metric receipt fields; no workspace state or comparison passages are passed into the export. The production caller obtains compatible annual/TTM prior periods through latestFinancialEvidence.
- Handbook parser excludes the cover and code-fence headings; expected existing handbook format is supported.
- No critical security issue found in reviewed scope. Full production build and interactive browser verification were not repeated here; root is already handling them.
