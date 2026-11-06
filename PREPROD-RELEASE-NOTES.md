# Signal research implementation — November 3, 2026

Based on preprod commit 5d69344. This release updates the real research application, not the separate illustrative design Site. Existing public, home, account, options and financial logic is retained.

## Changes

- Visible inline research navigation with consistent Lucide icons: Overview, Business, Valuation, Technicals, Analysts, Options, Case & ownership, News & earnings, Advanced. Core research no longer requires the large evidence drawer. Section selection updates the shareable URL.
- Compact company metrics and decision summary; price chart with adjacent Pace and analyst-coverage panels. Analyst targets remain separate from model scenarios, with an explicit unavailable state.
- Real chart periods: 1D, 1W, 1M, 3M, 6M, YTD, 1Y, 5Y, ALL. YTD is anchored to the most recent observation's year. Existing intraday fetching and daily/weekly/monthly grouping are retained.
- Price and OHLC inspection through the actual chart crosshair. Line/candlestick controls and colorful Fibonacci price lines, with dated 63-observation anchors and an explicit explanation. The existing custom-anchor tool remains in Technicals.
- Business includes the real financial explorer, income/cash-flow/balance-sheet statements, annual business history and financing context. Essential metrics are quick picks; the visibly labelled full metric selector retains the complete financial catalog.
- Technicals retains trend, moving averages, RSI/MACD, volatility, volume, reference levels, custom anchors and historical Pace tools. Definitions have visible disclosure affordances. Options/Gamma has a direct chart entry point; existing expiry controls, coverage guards and exposure calculations are preserved.
- White research canvas, calmer typography, citron Pace context, violet analyst accent, distinct financial-chart colors and responsive single-column layouts.

## Verification

- Full automated suite: 867 tests passed.
- TypeScript and clean final production build: passed. The 12 focused UI/timeframe checks also passed after the final URL cleanup.
- Desktop browser checks on the real components with local test fixtures: Business navigation and financial catalog; Technicals and its studies; 3M switching (263 to 67 displayed observations); Fibonacci overlay and dated anchors; crosshair inspection (selected date and price); Gamma button transitions to Options loading state.
- Screenshot: verification/signal-research/desktop.jpg. It uses explicitly illustrative test data, not a live account.
- Mobile CSS is included, but rendered mobile/PWA acceptance is outstanding. The 390px iframe test harness was blocked by the application's embedding protection; that protection was not weakened. The temporary harness is excluded from this package.
- Live provider credentials, real-account options data and investment-performance calibration were not tested in this UI pass. No financial formula or Pace threshold was changed. The separate design-preview Site was not redeployed.

Use the existing preprod branch; do not promote to production based solely on this UI review. Environment files, dependency directories, generated builds and Git metadata are excluded from the source ZIP.
