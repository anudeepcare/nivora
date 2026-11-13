# Portfolio screen refinement · November 13, 2026

## Changes

- Replaced direction-driven red styling with a consistent teal holdings line and dashed violet market line. Signed changes and percentage-point differences still show losses honestly.
- Added a simple market selector: S&P 500 via SPY or Nasdaq-100 via QQQ. Only the selected reference is requested through the existing authenticated, budget-guarded history endpoint. No provider keys, spending limits or services were changed.
- Added 1M, 3M and 6M calendar windows, a percentage/value toggle, compact axis dates, date-by-date touch/keyboard inspection and the underlying data table.
- Both percentage lines start at zero on the same shared observed date. A reference needs at least two matching dates. If it is missing, the real holdings series remains visible and comparison values stay unavailable.
- Retained the important distinction: today's fixed quantities at historical prices are not actual account returns. Cash, managed balances, margin, deposits, trades, fees and dividends are not modeled. Market references are not risk-matched benchmarks for every asset mix.
- Moved the portfolio range to a full-width row, preserving the holdings table and useful allocation/exposure cards. Bear/base/bull now use amber, blue and teal. Insufficient range evidence keeps the three scenario names visible with a reason and no invented values.
- Fixed benchmark switching during a pending history request so shared requests are retained rather than aborted and lost. The account-scoped cache and inactive-effect state guards remain in place.

## Verification

The comparison tests cover shared dates, equal rebasing dates, partial/missing market data, invalid values, empty holdings, declining holdings, calendar month-end boundaries and expanded history windows. A separate real-component effect test reproduces and protects the benchmark-switch loading race.

Final software-check results are recorded in `verification/portfolio-refinement-20261113/verify.log`. A local browser regression script is included at `scripts/verify-portfolio-browser.mjs`; it uses explicit synthetic QA fixtures, blocks external browser requests and removes its temporary route afterward.

Visual verification is incomplete in this executor: the cloud browser cannot reach the local server, and local Chromium cannot create its required socket even after an approved escalation. No screenshots or successful mobile/desktop/dark rendering are claimed. The styles and controls have source-level review, but should be inspected in a browser before release. The temporary QA route is not included in the source.

No live provider reads, deployment, purchases or repository pushes were performed for this refinement. Live SPY/QQQ availability remains dependent on the configured provider's permitted coverage; missing data is surfaced honestly.
