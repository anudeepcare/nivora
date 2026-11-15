# Mobile and alignment refinement — 2026-11-06

Changes: compact translucent top-only mobile navigation, search-on-demand using the existing accessible dialog, compact Portfolio/Watchlist rows with aligned values, smaller research identity and horizontally scrollable metric strip, corrected public benefit contrast, unified Help & legal footer presentation, aligned preference checkboxes, compact legal navigation and analytics control, and reduced watchlist introductory text.

Typography: self-hosted Commissioner variable font, Latin subset, SIL OFL 1.1. Source: https://github.com/kosbarts/Commissioner and Google Fonts ofl/commissioner. License: public/fonts/Commissioner-OFL.txt. Tabular lining numerals for data; restrained flare for headings. Existing fallback retained.

Validation:
- Existing test suite: 1,055 passed, zero failures.
- Narrow 390px static rendered previews inspected for Portfolio and Watchlist. Scripts removed in temporary QA harness to avoid cross-frame Next hydration; this verifies layout, not interactions. Harness removed.
- Existing search dialog reused; no authentication/model/data changes.
- Physical iPhone standalone PWA, keyboard and live authentication not verified.
- No deployment performed.

- Production build: PASS, optimized Next.js build including TypeScript checks and all 34 static pages.
