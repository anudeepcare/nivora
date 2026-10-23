# Approved research composition — 23 October 2026

The user approved the desktop/iPhone visual board generated in chat on 23 October. The board is a visual reference, with explicitly illustrative company numbers, not a data fixture or a certified valuation. Do not copy its IREN price, scenarios, cash runway, dilution or signals into production.

## Implemented in this revision

- Shared panel radius and DCA colour tokens, preserving theme and accent preferences.
- Stock overview: business headline and evidence tags above the price chart on desktop; valuation and DCA alongside. Mobile orders the investment case and valuation/DCA before the chart.
- Compact annual financial bar charts from the existing financial-period engine: revenue, operating cash flow less capex, and weighted shares when available. Only matching reporting currency and accounting basis are included. No absent series is manufactured, no quote currency relabelling and no projected annual values.
- Negative chart values extend below a shared zero baseline; exact values and period dates are available as text.
- Confirmed and forming monthly accumulation appear separately on the overview. A missing signal remains unknown. Original monthly-v1 remains the default; candidate performance has not established superiority.
- No new API requests, provider subscription, storage schema, order submission or paid AI activation.
- PWA status surface, viewport, safe-area and keyboard logic unchanged. This is not a new physical-device acceptance result.

## Validation and limits

Run npm run verify and npm run test:api. The existing preview route is localhost-only with AURYN_ENABLE_PREVIEW=true; it uses the same production components and explicitly synthetic data. View /preview/research/MSFT, /preview/portfolio and /preview/settings; the preview route will not expose demo content on production hosts.

Visual matching is not established by a successful compilation. Browser visual/device validation and source-provider accuracy checks remain separate acceptance work. This revision is not a new investment strategy, an all-ticker valuation guarantee, a claim of unique intellectual property or proof of an investment edge.

## Analytical acceptance before promoting a new DCA model

Use settled, split-adjusted histories; evaluate signal timing without look-ahead; compare the same dates, horizons and confirmed/forming states. Use equal external contributions and explicitly carried cash, transaction costs, independent chronological periods, adverse regimes and a diverse universe including failed/delisted companies where licensed data permits. Review sensitivity, zone stability and trading frequency rather than optimizing for a competitor's latest multiplier. Report missing/short histories and do not force 4x onto named tickers.

## Remaining application-wide design work

This revision applies shared primitives and the stock-overview composition. It does not claim every existing subtab, Home, Portfolio, settings, authentication or commercial feature has been visually rebuilt or accepted. Further screens must use the same tokens and actual components, with no wholesale removal of evidence or replacement of the PWA shell.
