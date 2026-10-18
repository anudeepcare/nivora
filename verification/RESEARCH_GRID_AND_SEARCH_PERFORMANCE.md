# Research grids and search performance

## Source changes
- News/filing rows separate metadata, headline and external-link icon. Headlines have consistent type, spacing and wrapping; mobile stacks sections.
- Overview and Financials apply actual positive/negative metric tones. Negative operating margins and cash outflows no longer show empty positive-only bars.
- Value ratios use aligned metric tiles and restrained blue numbers. Scenario number sizes are capped. Duplicate missing-case paragraphs replaced with one model coverage explanation.
- Data details preserve observation dates and backup-data disclosure without vendor names. Visible vendor-specific help copy removed. Publisher/SEC source links and chart attribution retained.
- Search now reuses the session's bounded resource cache, deduplicates in-flight requests, and caches equivalent normalized queries for five minutes. Fresh cached results skip debounce. Exact Bitcoin/Ethereum queries resolve locally without a paid symbol search. Outstanding obsolete requests may complete into cache but cannot replace current-query results.

## Verification
158 tests and TypeScript passed. Production build rerun after final help-copy edits passed. 61 built-handler fixture checks passed. Archive checksum and integrity verified by package script. No paid API or broker operations were submitted by these tests.

## Limits
No production timing benchmark or post-change visual browser comparison. No installed iPhone Safari PWA verification. No claim of universal smoothness or exact visual parity. NBIS/IREN infrastructure valuation models remain unimplemented; numeric scenarios have not been invented. This package is not production-ready and was not pushed or deployed.
