# Adaptive Home build — 23 October 2026

The full source package now includes the approved greeting, original daily perspective, navy feature, colored highlights, company-news rows, personalized attention list, session contributors, calendar and compact company links. Existing source modules, migrations and deployment instructions are retained.

## Selection and numbers

- Upcoming earnings: a supplied dated event for a followed company in the next seven days. The action opens that company's research.
- Without earnings: a recent identity-filtered company headline (seven-day window), otherwise another dated milestone, otherwise a quiet weekly review. No invented earnings date or business-change claim.
- A small original investing thought rotates once per Central calendar day. It is not generated on every refresh and costs no model/provider request.
- Session movement and contributor bars use the same `homeDay` computation during the same render. There is no independently frozen chart-selection reason. Prices with missing changes stay neutral; no 0-up/0-down assertion when changes are absent.
- Exposure is explicitly priced USD investments, excluding unpriced assets, cash, margin and managed balances. It is not account equity. Quote-reference impact is not brokerage P&L.
- News and calendar are checked in bounded 30-company groups. Every returned matching headline is reachable; all groups remain reachable. Missing provider evidence is not described as proof that nothing changed.
- One redundant search button and the extra Home price-history request were removed. Company links open stock research, and the portfolio action opens the portfolio. Other pages and accumulation thresholds are unchanged.

## Verification

461 tests, TypeScript and production build pass. Compiled API checks and signed-out HTTP checks are logged separately. Desktop and mobile rendering is inspected with Chromium at 1440, 402 and 320 widths, including dark theme and an emulated standalone flag. This is not physical iPhone or WebKit validation, nor proof of exact image-mock parity. Browser results: `verification/home-adaptive-browser.json`.

No production deployment, live account mutation or paid subscription/configuration change was performed. DCA outperformance remains unestablished; see `DCA_FROZEN_VALIDATION.md`.
