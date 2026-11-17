# Research alignment and content cleanup

News uses one 12-column grid: coverage and filings occupy eight columns, while earnings and reported activity stack in the remaining four. All three leading cards share the same top edge, padding and heading size. At tablet widths the activity cards share a row below the sources; mobile stacks each card.

Removed vertical source-row accents. Standard SEC forms show concise quarterly/annual/current report labels; original descriptions, dates and URLs remain accessible. Reported-activity explanations are available on demand.

Conditional valuation now uses a compact P/E control row with the reported multiple, horizon and dataset date. Removed duplicated section headings and raw provider copy. Assumptions remain expandable. Reset and case calculations are unchanged.

Verification: populated component renders at 320, 390, 768, 1440 and 1920 pixels in light and dark themes, including earnings metrics and conditional valuation/reset/expanded help. Source-card and heading top edges are asserted at desktop sizes. Relevant UI/regression tests, TypeScript, lint and production build passed. No production deployment performed.
