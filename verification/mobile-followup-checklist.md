# Screenshot follow-up checklist — November 5, 2026

Implemented in source:
- Phone/PWA floating bottom glass dock; desktop top navigation retained; dialog/keyboard handling and bottom safe-area clearance.
- Native system typography on mobile; Commissioner regular axes on desktop; tabular numerals.
- Compact portfolio price/value columns and watchlist price/trend alignment.
- Position editor and cash/balances mobile bottom sheets; compact field spacing and full-width save/cash action.
- Watchlist count collision replaced with explicit label markup.
- Targets tabs keep intrinsic width and scroll rather than shrink/overlap.
- Metrics help reduced to accessible inline info button.
- Centered segmented controls.
- Removed Pace top stripes and earnings side stripes; earnings labels and values on separate lines.
- Technical participation/list row density; no data removed.
- Shared dropdown chevrons, sizes and toolbar alignment.
- Home quick links aligned in one scrollable mobile row.
- Compact Research search, Discover and Compare forms.
- Dark logo tiles given contrasting surface, including fallback tickers.
- Help/legal navigation explicitly resets legacy sticky/sidebar positioning.
- Settings analytics matches neighboring links; Alerts control spacing aligned.

Verification: existing tests passed 1055/1055 after first implementation batch. 390px static rendered Portfolio/Watchlist previews inspected, confirming floating dock and no count overlap. Temporary QA harness removed. Physical iPhone PWA, live auth and full interaction journey not verified. Build status recorded in release output. No deployment.

Final source checks: 1,055/1,055 tests passed; optimized production build and TypeScript checks passed. These checks do not establish visual acceptance of every route. Remaining verification: physical iPhone standalone/keyboard/safe areas, all research sub-tabs with live data, dark-mode cross-page journey and authenticated edit/save flows.
