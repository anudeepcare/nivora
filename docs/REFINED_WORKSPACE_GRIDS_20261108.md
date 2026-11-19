# Research workspace grid revision

The previous release corrected individual spacing defects but left most workspaces as a stack of page-width panels. This revision changes composition and information grouping. Existing calculations, qualified-model gates, quote selection, precise price bands and Pro tools remain intact.

| Workspace | Composition |
| --- | --- |
| Overview | Balanced Pace/price-history columns, compact chart controls, visible three-case row and category metric cards. |
| Case & ownership | Drivers and risks in paired cards, business context alongside, compact checkpoints; full methodology remains accessible. |
| Business | Financial history beside the current-period cash bridge and statements. Historical durability and financing share the next row. All financial metrics remain in the selector. |
| Valuation | Qualified scenarios beside available analyst consensus. Reported multiples beside the expectations calculator. Model coverage uses a coordinated row. Four/five/six-metric datasets adapt without reserving missing tiles. |
| Technicals | Price history/risk beside the current readings and reference levels; Trend, Momentum, Volatility and Participation form a two-by-two grid. |
| Targets & estimates | One toolbar and active view. Ratings belong to Analyst targets only; annual estimates, conditional valuation and historical price risk use the available width. Missing rating evidence becomes a compact coverage message, while measured zeros remain visible. |
| News & earnings | Coverage and filings in the main area, earnings context beside them, events and reported activity grouped below. |
| Labs | Consistent metric spacing and four-column secondary metrics, retaining every research section. |
| Home | Smaller comparison banner, compact market cards, framed company/event panels and uniform expanded news cards. |
| Watchlist | Compact toolbar, rows and card spacing; existing filtering, alerts and actions remain. |
| Portfolio | Trend beside allocation and labelled sector exposure rows; the holdings ledger gets the full desktop width. The duplicate company-review callout is removed. |
| Options | Compact orientation and toolbar; contract, exposure, practice and definitions workflows remain. |

## Review and validation

- Inspect actual application routes for Home, Watchlist, Portfolio and all Research tabs, in desktop/mobile and light/dark, including expanded secondary sections.
- Exercise populated financial/valuation/target components with the dated observed IREN fixture, at 320, 390, 768 and 1440 pixels. Check independent grid placement and overflow. These are dated test observations, not current market claims.
- Check analyst ratings disappear from unrelated estimate views. Verify missing ratings collapse without hiding measured zeros.
- Recheck narrow Overview, short history, missing scenario inputs, price-zone inspection, Options interactions, the owner guide and public tools.
- Complete unit tests, lint, TypeScript and the production build before packaging; verify the saved archive's full extraction.

Browser screenshots are internal review material, not a separate deliverable. This source revision does not deploy the application or change production data. Fixture validation does not establish forecasting performance or live provider coverage.
