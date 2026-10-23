# Options and conditional projections

## Deployment

The dedicated Options research tab shares the existing owner-controlled feature access system. Its feature key is `options`; default is Pro. Enable it for other plans through Admin → Features if desired. No new database migration is required.

The server uses the existing EODHD key. Set `AURYN_OPTIONS_ENABLED=true` only after confirming the US options dataset entitlement and rights for the intended display. Existing All-in-One access does not establish entitlement to this marketplace dataset. No purchase is performed by this code. If disabled, the workspace explains why chain data is unavailable. Authorization failures do not fabricate contracts. Options-specific 402 entitlement failures do not pause stock pricing globally.

Requests are authenticated and feature-gated. Each user is limited to six requests per minute per process, in addition to shared market allowances. Responses use the existing provider cache/budget, with 15-minute server snapshot caching and at most four pages of 1,000 contracts per request. Chains reaching the bound are marked partial. Select a specific expiry to narrow the query or request a longer-dated expiry. No browser polling of full chains is installed.

## Calculations and limits

- Contract gamma is supplied by the dataset. Estimated signed GEX uses calls-positive/puts-negative as a disclosed convention, not verified dealer holdings. Unit: dollars of delta exposure per 1% underlying move. A current underlying price can differ from the EOD Greek observation.
- GEX is grouped by strike for one selected expiry and latest available observation date. Coverage and partial-chain labels are visible. Adjusted/nonstandard contract roots and non-100-share contracts are excluded from modeled standard-contract analytics.
- Gamma flip reprices a complete same-date standard-contract chain over 50–150% of spot using a European Black–Scholes gamma approximation, fixed per-contract IV, assumed 4% rate and zero dividend yield. Missing IV/OI/gamma or mixed dates withhold the profile. This does not model American early exercise, skew evolution, dividends or actual dealer inventory. No crossing means no supported crossing, not zero risk.
- ATM straddle midpoint cost is a move proxy. It is not a confidence interval or a forecast. Crossed, absent and zero-priced quotes are handled explicitly. Liquidity filtering uses positive bid, OI >=100 and relative spread <=20%; these are disclosed heuristics, not recommendations.
- Strategies: long call/put, covered call, protective put, cash-secured put, bull call spread and bull put spread. One standard contract per leg. Purchases at ask, sales at bid. Stock legs use 100 shares at displayed spot. Expiry payoffs exclude taxes, fees, assignment timing and slippage. Unbounded gains/losses are labeled. No orders or automatic trades are placed. Broker-specific margin and holdings coverage are not verified.
- IV rank, IV percentile, actual dealer positions, real-time trade flow, pre-expiry option repricing and probability-of-profit are not fabricated from a single snapshot. Crypto options are outside this US-listed dataset workflow.

## Earnings projection

Value now includes a conditional year-by-year earnings model with 1/3/5-year horizons, a chart, annual revenue/earnings/shares/EPS/price, and Bear/Base/Bull selection. Starting annual revenue, earnings, weighted shares and EPS must be positive, recent, non-foreign-listing, in the quote currency and reconcile within a 25% EPS tolerance; the business must be classified as an operating company. This is a consistency screen, not an independent audit.

Base assumptions are visible: 0% initial annual growth, reported net margin, illustrative 20x exit P/E, zero dilution and 10% required return. The user can change these. Bear/Bull are transparent sensitivity stresses, not analyst forecasts or probability estimates. Discounted terminal price excludes interim cash flows and is not a complete DCF. Existing supported sector and consensus scenarios remain separate.

## Admin expiry repair

Browser datetime-local is converted to ISO UTC before submission; the API rejects timezone-ambiguous timestamps. After saving a grant, the server reads the row back and verifies expiry and non-revoked status before returning confirmation. Duration selection is highlighted, expiry is previewed, grants are searchable/filterable, and Extend 30 days prepares a new date for review before saving. Recent activity shows action, member and local time. Backend owner enforcement remains unchanged.

## Validation commands

Run `npm ci`, then `npm run verify`, then `npm run test:api`. The API scripts use synthetic identity, database and market transports; they do not call a paid feed or charge a card.

## Acceptance limits

Synthetic calculation tests and local UI/API checks do not prove provider entitlement, production feed accuracy, commercial rights, physical iPhone behavior or live billing correctness. These require verification in the deployed environment. Do not advertise GEX as live when the dataset is EOD. No claim of parity with proprietary competitor signals or trading outperformance is made.

Local built-preview navigation passed for Options subviews and projection horizon switching in four desktop/mobile light/dark combinations. One initial research-preview load emitted a recoverable React hydration warning before Options was opened; that warning remains unresolved and is recorded in `verification/options-preview-browser.json`. No post-navigation errors were observed in those checks.
