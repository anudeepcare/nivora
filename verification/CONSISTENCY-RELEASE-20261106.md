# AURYN consistency and interaction release — November 6, 2026

Cumulative source update. No production deployment or push performed. This checklist covers both approved scope sets. Implemented means code is present; it does not certify native-device behavior or live providers.

## Scope and acceptance

| # | Approved item | Implementation and evidence | Remaining acceptance |
|---|---|---|---|
| 1 | Consistent daily changes across pages | Account-scoped shared quote publisher, subscriber and cache; Research and Workspace consume shared observations | Compare deployed provider snapshots across all four pages |
| 2 | Streaming daily change | EOD normalization retains previous close; missing percentage derives only from a valid reference; session rollover tests | Live stream/provider session checks |
| 3 | Missing values | Missing remains null; no invented zero; regression coverage for unavailable references | Feed-dependent coverage |
| 4 | Shared refresh and stale response protection | Request coalescing, chronological merge, same-observation reference preservation; publication never overwrites a newer cached quote | Real network latency/load |
| 5 | Freshness labels | Existing dated live, reconnecting, older and as-of states retained and tested | Provider timestamp accuracy |
| 6 | Portfolio chart inspection | Pointer/touch, keyboard arrows/Home/End/Escape, exact date/USD value, crosshair, accessible slider | Native touch ergonomics |
| 7 | Portfolio coverage | Included count, excluded symbols, calculation disclosure; missing-history batches now advance past failed symbols | Provider availability |
| 8 | Stable chart universe | Existing common-date intersection and fixed included universe retained; no filled prices | Not transaction/account performance |
| 9 | Portfolio fit recovery | Missing/older quote counts and refresh action; incomplete weights withheld | Live affected account |
| 10 | Holdings toolbar | Existing compact desktop row/mobile two-row layout retained | Native keyboard |
| 11 | Portfolio metrics | Cost/unrealized/current value/weight retain existing calculation guards; partial pricing disclosed | Live positions reconciliation |
| 12 | Research interpretation | Business strength, valuation and confirmed Pace explained separately; supported/expensive can coexist | No investment threshold changed |
| 13 | Pace | Existing single headline badge, confirmed default and explicit forming preview retained | Live end-of-period source validation |
| 14 | Metric audit | Existing period/currency/nonpositive denominator/comparability rules retained; financial explorer has unit-specific help | No missing data fabricated |
| 15 | Gamma and options | Existing modeled-GEX/OI help, limitations and aligned contract/filter controls retained | Live chain entitlements/data |
| 16 | Charts | Home and financial explorer now inspectable; accessible controls and vertical touch scrolling; existing range and empty states retained | Native touch/scroll checks |
| 17 | Logos | Existing HIMS/NOW theme-aware assets and ticker fallback retained | External asset failures |
| 18 | Workspace/session recovery | Existing 401 refresh/coalescing, 403 permission, 503 temporary classification retained; Opening your workspace wording | Expired deployed session and affected account |
| 19 | PWA top area | Existing root/header theme surface, viewport-fit, safe-area and Apple status configuration retained | Installed iPhone status-bar blending is NOT certified |
| 20 | Dock | Existing single border/shadow, no selected inner shadow and bottom space retained | Installed PWA overlap/keyboard |
| 21 | Glass surfaces | Restrained blur for navigation, readable cards, reduced-transparency fallback retained | Device frame pacing |
| 22 | Responsiveness | Quote notifications scoped to relevant symbols; cached content and progressive batches; existing pending feedback | Real-device profiling |
| 23 | Responsive layouts | Browser matrix covers 390/768/1440 widths in both themes | Other devices/large text |
| 24 | Public pages | Existing single CTA/footer, aligned help/legal/contact and clearer wording retained | Public production smoke check |
| 25 | Accessibility | Chart keyboard/ARIA values, focus styles; existing reduced-motion and control labels retained | Screen reader/device walkthrough |
| 26 | Explain metrics | Financial explorer unit examples and expandable help; existing per-metric definitions retained | Copy review in actual company contexts |
| 27 | Explain missing data | Portfolio weight and missing histories have direct recovery actions; metrics keep explicit absent values | Provider-specific failures |
| 28 | Changes since observation | Previously unused ResearchChanges now connected; actual prior snapshot comparison, first-visit baseline and unchanged states; account/device disclosure | Persistence across browsers intentionally not claimed |
| 29 | Preserve context | Research tab cached per symbol/account; watchlist asset filter cached; existing query, navigation and scroll preservation retained | Back/forward on native app |
| 30 | Cached loading/retries | Existing account-scoped resources retain content; progressive quote batches; targeted portfolio recovery | Deployed auth/network failures |
| 31 | Distinct return meanings | Daily move, unrealized return and current-holdings-at-historical-prices remain distinct | Historical chart is not actual account performance |
| 32 | Why this view | Business/valuation/Pace explanation and review factors in investment context | No predictive claims added |
| 33 | Predictable interactions | Existing dialogs/Escape/loading states retained, charts keyboard-operable | Full live mutation flow |
| 34 | Recoverable actions | Watchlist removal now offers Undo; existing form input retention and double-submit guards retained | Authenticated undo/contact submission |
| 35 | Controlled PWA update | Waiting worker prompts Update & reload / Later; explicit activation only, no install-time skipWaiting | Installed two-version update cycle |
| 36 | Performance measurements | Local bounded long-task/slow-interaction/layout-shift counters in opt-in diagnostics; no account/page content | These counters are not certified Core Web Vitals or a 60fps guarantee |
| 37 | Release acceptance | Full automated suite, production build, responsive browser report, ZIP integrity manifest | Native/live checks above remain release gates |

## New regression coverage

EOD reference-close retention, derived/missing daily change, session rollover, account isolation, rejection of older observations, retention of richer same-timestamp observations, missing-history fairness, explicit worker activation and bounded performance counters.

## Verification

Automated suite: 1,072 passed, zero failed. Following the final cache overwrite correction, 19 focused quote/workspace/research regressions passed. Production build passed (34 generated pages). Browser matrix: 54 page visits across 390/768/1440 widths and light/dark, all HTTP 200, no document-width overflow or page JavaScript errors. A separate hydration-aware chart pass checked 12 Home/Portfolio combinations: all charts present; Portfolio keyboard and pointer values changed correctly in all six combinations. Financial explorer keyboard inspection passed in all six main-matrix combinations. Tests used preview fixtures, not live account data.

## Limits

A source ZIP cannot guarantee all live feeds, device rendering or deployed authentication policies. No database policies were weakened, no trades placed, no production changes made. Do not mark native PWA appearance, smoothness, authenticated mutations or live data reconciliation complete based on fixture screenshots.
