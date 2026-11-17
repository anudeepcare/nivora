# Product refinement — 19 October 2026

## Implemented

1. **Price credibility:** the entry assessment now validates against the time the current quote was observed, independently of the older research/statement snapshot. It uses the same quote-health rules as display. A genuine “Refresh price” action retries the quote request instead of navigating to Technicals. Regression tests cover a fresh trade after the snapshot, an expired trade and an excessively future-dated trade.
2. **Consistent presentation:** scoped spacing, readable labels, restrained card borders, semantic risk colours and responsive controls. No changes to the PWA shell, status-bar surface, document scrolling or keyboard handling.
3. **Home attention:** upcoming supplied company events ranked by actual priced holding exposure, then date; event rows show dollars and weight. Headlines also rank by priced holding exposure. This is exposure-based ordering, not an AI assessment of news materiality. Selected universe remains bounded to thirty stocks.
4. **Portfolio:** top-three concentration, next-seven-day earnings exposure, crypto exposure and saved holding-thesis count. Watch labels identify pricing gaps, nearby earnings or concentration of at least ten percent. The calendar is shared by the summary and rows.
5. **Partial returns:** missing holdings no longer blank the entire return display. Displayed return uses only investments with usable USD prices and labelled USD costs, with the exact included/total count. The canonical complete-account return remains unavailable when coverage is incomplete; no FX, realized gains, dividends or fees are inferred.
6. **Company evidence:** generic driver cards became an optional research checklist. Missing segment results are concise; methodological limitations expand only where relevant. No invented company-specific moat or revenue mix replaces missing evidence.
7. **Valuation:** model wording now explains the cash-flow growth required by today’s price and distinguishes model-implied discount rates from investment returns. The workbench is collapsed in Simple mode and initially open in Pro. Primary conditional cases remain separate from consensus.
8. **Advanced:** compact benchmark controls, method details and an optional peer-evidence workspace reduce empty setup panels. Specialist studies remain separate from Overview.
9. **Simple/Pro:** the same saved setting is available beside appearance controls and directly on research. It changes displayed depth, not data or a claimed signal advantage.
10. **Review conditions:** current threshold readings now show their reporting-period date and plain “Review now”/“Within this threshold” labels. Optional decision records have smaller empty states and separated controls.

## Data and design boundaries

All dollar values and portfolio weights are calculated from the user’s recorded positions and available prices. None of the approximate example allocations or bracketed placeholders in the external design proposal were inserted as production data.

The external Claude artifact was inaccessible. This refinement uses the supplied screenshots and pasted requirements; it does not claim pixel equivalence with unseen boards. The existing approved shell and design are preserved.

The next-seven-day earnings figure uses available scheduled dates, not a prediction. Failed calendar coverage displays “Incomplete”; unavailable dates and holdings beyond the bounded universe can still be absent. Exposure weights use priced USD assets plus recorded USD cash. Research records count saved text, not validated theses.

Automated, type and production-build evidence is recorded in verification/REPORT.json and product-refinement logs. Rendered-browser acceptance, physical iPhone installation and deployed paid-provider/AI acceptance have not been performed for this patch. Previously documented shared-budget/AI activation steps still apply.
