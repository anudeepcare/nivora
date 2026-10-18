# Metrics and mobile polish — 18 October 2026

## Included
- Legacy installed /analyze start URL redirects to Research; saved /stock links redirect to the current stock route. This addresses the supplied first-launch unavailable-view screen.
- Search capsule focus clearance, stacked mobile heading/period controls, visible DCA history and a safe-area background strip. Existing document scrolling from the working reference remains.
- Home earnings/splits over the next 30 days for up to 30 followed stocks; recent news for the first three. Calendar report dates are separate from fiscal period dates, reverse split ratios are preserved, and unsafe/future news is filtered. Calendar cache is six hours; news cache is one hour. No entitlement upgrade or additional AI calls.
- Four primary financial metrics remain; additional available metrics are grouped into profitability, reinvestment and balance sheet with definitions. Missing values are not fabricated.
- Technicals add EMA20, 20-session momentum, directional indicators, fast stochastic (14,1,3) and Bollinger position, using existing history. Six confirmed DCA months and the forming reading are visible. DCA is an original unvalidated price-based model, not the private competitor algorithm.
- Thesis evidence groups have distinct positive/risk colouring. Home event links open Thesis directly.

## Verification
175 automated tests passed, TypeScript passed, production build passed. 64 built API fixture checks passed, including three new Home checks (dates/news, cache reuse, invalid crypto pair rejection). Tests use mocked transports and do not consume paid market-data calls.

## Not verified
No physical installed iPhone or rendered browser acceptance test of this source build was available. Safe-area blending, keyboard animation and visual parity require device review; this is not a verified permanent device fix. Live calendar/news entitlement, current provider values, private competitor metrics, and company-specific fair-value models were not validated. Earlier valuation safety guards remain; unavailable evidence is not replaced with invented bear/base/bull prices. No deployment, Git push, database changes or broker orders were performed.
