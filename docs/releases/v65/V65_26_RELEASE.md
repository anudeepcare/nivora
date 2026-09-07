# NIVORA V65.26 — Portfolio V2

## Rebuilt
- Decision-first Portfolio Command Center.
- Period return and SPY comparison only when exact history exists.
- Cash, Health and largest-position metrics surfaced immediately.
- Capital Map separates Deploy, Hold/Wait and Review evidence.
- Visual Intelligence promoted ahead of deep diagnostic content.
- Health, analyst brief and X-Ray moved behind progressive disclosure.
- Holdings refined for desktop rows and mobile cards, including portfolio weight.
- Edit/Delete remain inside a quiet overflow menu.
- Mobile/desktop Portfolio V2 CSS isolated from stock/trading layouts.
- Info controls remain deliberately low-attention.

## Performance
Deep diagnostic components are not mounted until Portfolio Evidence is opened. The rebuild adds no presentation-only network requests and reuses the existing memoized Pulse calculations.

## Verification note
Source-level verification completed. Production `next build` could not be executed in the packaging environment because dependencies were not installed in the uploaded archive (`next: not found`); an attempted `npm ci` exceeded the environment execution window. Run `npm ci && npm run build` after extraction/deployment.
