# Workspace polish — November 8, 2026

This pass corrects composition rather than replacing the visual language again. Keep the existing React/Next application, semantic gradient cards, AURYN diamond, Pro tools, decision engine and model input gates.

## Changes

- The ownership context controls occupy a shared row above Pace and price history. Both panels now start at the same vertical position on desktop; mobile retains decision-first order.
- Keep the full historical business charts in Business; Case & ownership now opens with the investment case instead of repeating that entire history panel.
- Move changes since the previous observation out of the narrow Pace column into a shared row. Retain decision evidence and risk inspection.
- Remove the duplicate Valuation introduction. Bear, base & bull is the primary heading, with Test assumptions in its header; cases, assumptions and synchronized fiscal-year selection remain intact.
- Consensus comparisons use the same eligible quote or settled close as the research header. Reported target values are unchanged. A regression fixture covers a later settled close superseding the raw quote.
- Remove the cash bridge's inherited empty column, left divider and padding. Explain that capital spending is a deduction and the bars share a scale. Hide an empty bridge container when no reconciled bridge qualifies.
- Initial and expanded Home news share one article renderer and responsive grid, including ticker link, logo, timestamp and external source. All additional headlines remain accessible.
- Reveal the active Research tab within the horizontal mobile navigation on deep links, section changes and resize, without vertically scrolling the page.
- Tighten Targets & estimates title spacing and analyst summary tiles. Apply consistent section heading sizes and spacing across research desks.

## Verification scope

Use actual application preview routes for Home, Watchlist, Portfolio and every Research tab at desktop/mobile widths in both themes. Wait for dynamically imported tab content, not only the page heading. Open secondary details in Business, Valuation, Targets and News and check document overflow. Use an explicitly populated nine-story news fixture to exercise expansion; the ordinary demo intentionally contains no simulated news.

Component browser checks additionally cover narrow widths, ownership context, price-zone inspection, short history, unavailable scenario inputs and the evidence crystal. Unit checks cover the common consensus reference and uniform expanded news markup. Production build, lint and TypeScript validation are required before packaging.

These checks validate presentation, interaction and deterministic calculations against supplied fixtures. They do not establish forecasting accuracy or verify live provider coverage. No deployment or database change is included.
