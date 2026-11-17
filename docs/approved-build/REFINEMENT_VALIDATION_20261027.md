# AURYN approved refinement — 27 October 2026

This source release preserves the existing application and its detailed research while tightening the approved visual design. It follows baseline `1192f3d`; the main refinement is `c09cd4a`, followed by the final review fixes in the packaged source. It does not deploy or change production.

## Verification

Final command results and logs are included under `verification/refinement-20261027/`. The release manifest records the exact source commit and file hashes.

- Automated tests: 769 passed; zero failed, skipped or cancelled.
- TypeScript: passed (`next typegen && tsc --noEmit`).
- Optimized production build: passed; optimized production bundle and 29 generated static pages.
- Compiled API route checks: all nine scripts passed, including shared-market protection, auth/access, billing, options, owner expiry and research/provider regressions. External account, database and market transports are mocked by these scripts; these are not live-service checks.
- Pace integrity script: passed mechanics and accounting checks on five synthetic paths at two cost assumptions. It also recomputed summaries of the stored evaluation reports; it did not fetch or rerun their original market histories.
- Fresh whole-branch review: no critical findings; ticker alias handling and customer-facing coverage messages were corrected. Period-neutral Pace help was also corrected. Regression tests reproduced each functional failure before the fix.
- Browser checks: local Chrome preview, responsive iframe widths 360, 390, 430 and 1280 pixels, plus the desktop viewport. Both light and dark themes were inspected. The temporary viewport harness and preview-only environment file were removed, and `X-Frame-Options: DENY` restored before the final production build.

## Approved scope and evidence

| # | Approved concern | Delivered behavior and evidence |
|---|---|---|
| 1 | Spacing, grids and card heights | Shared moderate density in `app/product-refinement.css`; desktop research and mobile research, portfolio, watchlist and public layouts inspected. |
| 2 | Typography and colour | Readable hierarchy, semantic timing colours and properly sized search fields; light/dark screenshots inspected. This was not a formal accessibility certification. |
| 3 | Decision first, less duplication | One primary AURYN View, concise reasons and checkpoints, with deeper research in evidence drawers. Removed the duplicate accessible Home news heading. |
| 4 | More useful header metrics | `CompanyMetrics` shows applicable business and valuation metrics with periods and help. Financial and sector regression tests remain passing. |
| 5 | Consistent action and ownership | Shared decision/edge logic drives company views and workspace tools; ownership uses canonical symbol identity. Seven actions are tested against every Pace level. |
| 6 | Own Pace branding and help | P means Pace: P0 Paused, P1 Steady, P2 Increased, P3 Elevated, P4 Accelerated. Shared help explains contribution factors and separates a business-risk pause from raw technical P0. Mobile help opened and closed successfully. |
| 7 | Realistic funding assessment | Expansion-capex negative free cash flow alone no longer triggers distress when operating cash generation is positive. Short operating runway remains a risk; banks and insurers avoid ordinary-company runway rules. Behavioral tests cover these cases. |
| 8 | Metric correctness | Existing period, currency, unit, share-count, valuation and funded-scenario tests rerun. Fair-value assumptions, analyst targets and historical price-risk scenarios remain distinct. See the metric register and financial validation documents for the retained calculation inventory. |
| 9 | Resilient supported tickers | Source fallback, directory enumeration, currency recovery and identity checks exercised with mocked transports. US aliases including `AAPL.US`, `NASDAQ:AAPL` and class shares are canonicalized. Foreign suffixes cannot silently map to US shares. |
| 10 | Search, settings, Back, logout | Search trigger/form style collision fixed; keyboard selection opened Microsoft. Settings Back returned to the initiating research page. Sign-out is first-level; it is intentionally disabled in the isolated preview. |
| 11 | Explore journeys | Names match Discover, Compare, Strategy lab and Paper trading. Current destination is omitted. Browser navigation exercised Discover, Compare and Strategy lab; protected paper capability is covered by server/client tests. |
| 12 | Comparison | Successful peers survive a failed selection; identity, dates and currency compatibility are checked. Browser comparison accepted `AAPL.US, MSFT`. Discovery retained both companies when `INVALID` was also requested. |
| 13 | Charts and Pace periods | Shared current/forming-first and completed/confirmed-second readings retain individual dates. Chart ResizeObserver cleans up and fits when visible. Browser test resized 430→1280, selected 1M, closed and reopened the drawer, and confirmed the same 24-observation chart remained visible. |
| 14 | Movement, news and earnings | Missing price change is labelled Latest price rather than a fabricated percentage. Publisher attribution remains. Home feed tests cover all followed-company batches, partial failures, deduplication and multiple companies reporting on the same date. Preview news/events remain explicitly unsimulated. |
| 15 | Portfolio and import | Approved five-column and legacy eight-column tables have distinct width rules. Both monetary and percentage return are shown. Mobile portfolio and add-position dialog inspected. CSV chooser retains native file selection with an accessible visible label; ledger/import regressions rerun. |
| 16 | Public, auth and mobile | Public hero, CTA, product guide and login layout inspected. Research, settings, portfolio, watchlist, tools and drawers fit the tested mobile widths. PWA/auth regressions rerun; physical-device installation and real sign-in were not exercised. |
| 17 | Clear language and fewer repeats | Shared decision/Pace wording, period-neutral help, neutral data-source terminology and meaningful movement labels. No market-vendor branding in the revised customer display/export/error boundaries. |
| 18 | Actual verification | Full test suite, typecheck, production build, compiled API scripts, focused regression cycles and browser inspection; results are bundled rather than inferred from code review. |
| 19 | Production density plus preview design | Compact header metrics and useful deep research retained. Main chart and independent price cases are earlier on the research page. Desktop and mobile views inspected. |
| 20 | Production/preview Pace discrepancy | No level is silently overwritten: a forming P4 and confirmed P2 can coexist with distinct dates. Identical research snapshots use the same observation clock across surfaces; wall-clock freshness still affects the business decision. Actual deployed production inputs were not available for a live parity comparison. |
| 21 | Hide market-vendor branding | Customer-language boundary applied to dynamic notices, coverage help, empty financials, AI claim text and exports. Rendered regression tests inject vendor-specific errors and verify neutral customer text. Internal provenance and genuine news/filing attribution remain. |
| 22 | Speed | Cold search tries targeted lookup before full-directory fallback; warm directory and cached-research suggestions remain available. Reused decision/edge calculations reduce CPU work. Six-fixture benchmark shows 33–40% lower cold calculation medians, and 41–61% lower repeat medians. This is not an end-to-end network latency result. |
| 23 | Tool permissions | Paper management requires configured ownership plus trusted application metadata/admin configuration, matching the server guard. User-editable metadata cannot grant the capability. Existing auth and account-isolation tests rerun. |
| 24 | Reviewable delivery | Full source, approved spec/plan, metric and coverage reports, this checklist, raw validation logs and performance evidence are included. Archive manifest identifies the exact commit and files. |

## Final review repairs

1. Canonicalize ticker aliases before fetching or comparing results; preserve share-class identity and reject foreign-exchange collisions.
2. Neutralize raw vendor wording in coverage help and financial empty states, without altering stored provenance.
3. Replace month-specific shared help with completed-period wording, so weekly views explain confirmation correctly.
4. Use the same forming-first Pace cards in the technical drawer; adjust its desktop/mobile grid for the two-card component.
5. Wrap Discover filters on small screens. Browser measurement changed from a 437-pixel document inside a 420-pixel viewport to exactly 420/420; table scrolling remains inside its own container.
6. Do not convert a failed targeted search into an empty success merely because a complete cached directory has no match. The shared-market API check exposed this; a new provider regression reproduces the failure, and the fix preserves the error when no fallback result exists.

## Performance method

`verification/refinement-performance-20261027.json` compares baseline `1192f3d` with the refinement on the same machine/process. Each of MSFT, AAPL, NVDA, APP, IREN and ASTS used 1,306 fixture bars, 12 fresh cloned-input calls and immediate repeat calls; reported numbers are medians. Search transport timing depends on the configured live service and was not benchmarked here.

## Limits that matter for release

This package verifies source behavior, compiled routes with mocked services, synthetic mechanics and the observed browser journeys. Production credentials were not supplied, so no live market entitlement, production/preview snapshot parity, real account login, payment, email delivery or deployed database check is claimed. The local login correctly showed its unavailable-service message. Preview options had no contract snapshot; it did not invent prices. Device-specific Safari and installed PWA behavior were not checked on physical devices.

The existing stored backtest summaries have a different policy hash and were not rerun from raw histories. They are historical evidence, not validation of the current policy's investment performance. The synthetic evaluation includes cases where adaptive contributions underperform fixed contributions. This release does not claim market outperformance, reliable prediction, universal provider coverage or zero defects.

Valid supported instruments should retain every usable dataset and show specific status for missing components. Unsupported exchanges and genuinely unavailable datasets cannot honestly be made complete by code. The interface preserves useful results and dates rather than manufacturing financials, news or recommendations.
