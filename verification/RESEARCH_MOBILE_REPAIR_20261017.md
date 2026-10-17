# Research and mobile repair — 17 October 2026

## Observed defects and changes

The APP screenshots were inspected from the uploaded local images. The quote marker at $266.13 was clamped inside an illustrative range ending at $190.41. The scale now includes both the quote and scenario range, and shades only the example range. The custom slider output is explicitly separate from the fixed examples. Generic cash-flow examples are still not a source-backed bear/base/bull valuation.

The financial case no longer treats small positive net debt as an automatic bear argument when positive cash generation provides important context. Positive net income alongside an operating loss now triggers an earnings-quality review instead of being treated as operating profitability. The financial evidence layout flows with its actual entries, avoiding an empty bull/bear column. Unpopulated specialist assumption forms were removed from the primary valuation view.

For mobile navigation, the account session and shell previously lived below the changing catch-all page. The root layout now owns them, preserving the session/workspace while routes change. Primary navigation remembers each tab's scroll offset, including when a company is opened from a list. Tapping the active tab does not navigate. Portfolio and Watchlist filters remain in account-scoped memory; sign-out clears that cache. Ordinary navigation no longer reapplies a global smooth-scroll animation.

The quote request effect depends on the actual rate-limit regime, rather than changing provider metadata, so discovering a Twelve/hybrid connection does not restart the same quote batch. Cached quotes stay visible during refresh. Price-update errors occupy the existing status area, with details available from Help, instead of inserting another banner above the list.

Mobile holdings use a compact identity/value/action grid with price and unrealized returns below. The source date remains accessible. Quantity and cost remain in the position editor and on the desktop row. Allocation follows holdings on small screens. Watchlist rows lead with the ticker, use a single company-name line, reserve quote-status height and retain 44px action targets. These are edits to existing layout rules, not another appended override stylesheet.

## Verification scope

- `npm run verify`: see `research-correction-verify.log` for the exact test count, TypeScript and optimized build result.
- `npm run test:api`: see `research-correction-api.log` for compiled-handler checks using fixture transports, not the paid providers.
- Actual component callback checks cover primary-tab position restoration, return from company research, same-tab taps, persistent session placement and preview isolation. Financial regressions cover the out-of-range quote marker, custom calculator interaction, debt context and non-operating earnings.
- Live Twelve Data quote checks covered NBIS, IREN, APP, NOW, MSFT, AAPL, NVDA, GOOG, META, CIFR and ETH/USD. Raw normalized observations and dates are in `cohort-quotes-20261017.json`. This validates quote identity only, not valuation, all company financials, or parity with either reference product.

## Acceptance still open

No post-patch browser rendering or installed-iPhone test was possible in this environment. The managed Sites workflow does not expose the required browser-control capability for local QA. This report therefore does not certify safe-area behavior, pixel alignment, keyboard/VoiceOver use, or scrolling on an actual device. Production has not been changed by these source edits.

Company-specific scenarios, durable shared research snapshots, source-backed qualitative theses and walk-forward performance validation remain implementation work described in `docs/RESEARCH_TERMINAL_SPEC_20261017.md`. The source corrections are not evidence of a profitable strategy or a completed terminal.
