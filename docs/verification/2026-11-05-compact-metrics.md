# Compact metrics and icon refinement — AURYN 1.0.0

- Replaced large colored stock-fact tiles with a slim inline metric strip. Financial reporting/dataset dates remain accessible in each fact's Help. Mobile uses a two-column arrangement without large cards.
- Technical metric rows now show the name, value and a dedicated Help button. Removed nested summary rectangles, alternating boxed stripes and row divider borders. The section retains one outer surface.
- Fibonacci and price-reference grids no longer have an extra outside border around individually framed children. Reference items use a single soft surface with consistent spacing.
- Added a shared decorative SectionIcon for workspace headings, stock facts, technical groups, price reference map, valuation headings and historical-outcome cards. Adjacent text remains the accessible label.
- Historical outputs are labelled Historical price outcomes instead of Bear/base/bull when the source is historical price risk.

## Browser evidence
Local illustrative MSFT research showed the compact fact row above navigation. Scrolled technical groups showed plain aligned rows without the previous nested blocks. Wilder ATR Help opened the explanation dialog. Desktop only; physical mobile acceptance is pending.

No financial engines, datasets, API routes, provider settings or saved account data were changed. No push or deployment was performed.

Focused component checks: 65 passed. Updated the component-test loaders to supply the shared decorative icon and Help dependencies; financial assertions remain unchanged.

Final validation: 975 tests passed. Production build passed after clearing an obsolete generated export directory and rerunning. No source change was required for that build-output cleanup.
