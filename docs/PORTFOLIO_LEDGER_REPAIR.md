# Portfolio ledger and charts — 19 October 2026

## Root cause

The mobile `.holdings-table` grid mixed explicit value/action positions with an implicitly placed company cell. Adding Watch into the first grid column displaced company identity to the right. The resulting rows spread across columns incorrectly. The previous implementation introduced this conflict.

## Repair

- Replaced Portfolio's legacy table with `PortfolioLedger`, whose own classes and named mobile grid areas explicitly place company, value, result, edit and review information. Its layout does not use `.holdings-table` or `.holding-watch-cell`.
- Removed the added legacy Watch CSS rather than retaining it as another override.
- Largest-value, return and ticker sorting; the existing holdings filter remains.
- At a mobile glance: company on the left; current value and signed unrealized dollars/percentage on the right; edit at the edge; actual review flags below. Routine “Price current” badges are removed.
- Duplicate positions retain separate editable records, while concentration weights combine their ticker exposure.
- The position editor now has its own layout, compact numeric fields, smaller close control and initial title focus. It preserves existing visual-height/keyboard offsets and native dialog behaviour; the app's PWA status-bar surface is unchanged.
- Sector/stress detail is optional below the ledger, instead of pushing holdings down behind another large primary panel.

## Meaningful charts

One compact chart panel switches between:

1. **Allocation:** a labelled stacked allocation bar with top positions and an explicit Other remainder. Duplicate tickers combine; recorded USD cash is included.
2. **Gain / loss:** a diverging chart of the largest absolute unrealized dollar changes, using recorded USD costs and usable USD prices. Losses appear left of zero, gains right. This is not a historical or daily-performance chart.

Unpriced holdings are excluded and disclosed. Unknown-cost positions do not generate a gain/loss estimate. A ticker with incomplete duplicate-position cost/pricing is withheld from the gain/loss series.

## Verification and limits

265 automated calculation, component, security and database tests passed, followed by TypeScript and production builds. Built API fixture checks are recorded separately. The new render tests check identity/value/edit content and gain/loss sign; calculations reconcile duplicate holdings and incomplete pricing.

A browser runner was available but its browser binary download failed; rendered-browser layout tests could not run. No physical iPhone or production-account acceptance is claimed. This is a source/layout correction based on the supplied screenshots and source-level cascade review, not a measured iPhone screenshot comparison.
