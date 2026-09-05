# V65.21 Mobile Design System

## Goal
Make Analyze, Portfolio, Trading Lab and Alerts feel like one refined mobile product while preserving desktop and all decision/data logic.

## Approved design
Use one mobile typography scale, spacing/grid system, card system, button/tab system, fixed bottom dock and standardized circled-info component. Portfolio cards become denser, chart containers size to useful information, horizontal selectors scroll intentionally, and content never sits under navigation.

## Acceptance
- 390px viewport remains readable with no clipped selectors.
- Bottom navigation has three equal destinations, touches the viewport bottom and reserves safe-area/content space.
- Labels, body copy and values use consistent shared mobile tokens.
- Information icons are optically centered geometric SVG.
- Portfolio holding cards remove duplicate visual weight and use compact two-column metrics.
- Charts do not reserve large empty heights when history is sparse.
- No scoring, market-data, portfolio math or trading semantics change.
