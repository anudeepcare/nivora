# Coherent glass and mobile navigation

## What changed
- One shared outer glass treatment, inset metric treatment and control surface, with cool indigo/teal depth and readable light/dark text. Panels retain useful grouping and metric grids.
- Disclosure rows use their parent surface rather than an opaque white bar. Expanded consensus uses an explicit embedded variant so its stronger component styling cannot reintroduce a nested card. Assessment tools and ownership/questions follow the same insets.
- The 30-second read and conditional cases share a desktop row; smaller screens return to one column. Expanded business checks size to their actual panel, rather than squeezing three columns into half a screen.
- Positive, negative, neutral and caution colors are shared theme-aware tokens. Bear/base/bull remain distinct with labels, values and existing calculations. Navigation accent preferences do not change financial meaning.
- Desktop navigation uses a compact segmented group. Mobile has a four-destination floating glass dock, recognizable menu button, touch-sized rows and consistent search/tools dialogs.
- Safe-area insets and keyboard-open behavior are retained. Manifest allows landscape. Offline shell and icon use a versioned cache, old AURYN offline caches are cleaned, and account/API/market responses remain uncached. Updates still require the user's explicit Update & reload action.

## Integrity and review
All baseline files are retained. All files under lib, app/api, services and supabase are unchanged. No financial formula, model input, target, provider or account permission was edited. Independent code review identified and the implementation corrected invalid gradient stops, incorrect surface-token use, embedded-style specificity, reduced-transparency specificity and narrow expanded checks.

## Verification and limits
See `verification/mobile-glass-20261115/summary.json` for final command results. Contrast tests cover text and positive/negative/neutral/caution colors against bounded glass surfaces. Navigation, viewport and service-worker tests cover their code contracts.

Actual browser rendering was attempted but blocked: local Chromium cannot create a required socket; escalation did not remove this restriction. The cloud browser could not access the local preview. No screenshots from the final candidate were produced. Physical iOS/Android installed-PWA behavior is untested. Do not equate static assertions, fixture tests or build success with visual signoff.

## Required acceptance before deployment
1. With Node 24, run npm ci and npm run verify. To preview synthetic fixture data locally, run AURYN_ENABLE_PREVIEW=true npm run dev, then visit /preview/research/MSFT and /preview/overview. The preview is localhost-only and disabled in production.
2. Check 320, 390, 768 and 1440px widths in light/dark themes. Review Overview, Business, Valuation, Case & ownership, Targets & estimates, News & earnings, Technicals, Options, Home, Watchlist and Portfolio. Preserve all values and data dates.
3. Expand consensus, risks, business checks and assessment tools. Check readable text, shared panel edges, metric boxes, table scrolling and absence of horizontal document overflow.
4. Exercise menu/search repeatedly, Escape/Close, back/forward, keyboard open/close and lower safe-area clearance. Test reduced motion/transparency and large text.
5. On installed iOS and Android, test portrait/landscape, status bar, bottom home indicator, offline launch/retry and a real service-worker update after saving any work. Offline is an explanatory recovery screen, not offline financial data.

No production deploy, push, external publication or database change was performed.
