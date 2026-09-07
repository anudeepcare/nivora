# AURYN V4.2 Market Truth & Canonical Decision Design

## Goal
Make AURYN fail closed on unreliable market data and ensure every stock-page surface and price-sensitive decision consumes one canonical, auditable market snapshot.

## Problems confirmed from production screenshots
- Header price can come from a stale provider while research/levels use a different daily-analysis price.
- Provider disagreement can be shown alongside a confident-looking price.
- Closed-market handling does not understand U.S. exchange holidays.
- Action-plan levels, valuation context, technicals, and decision can anchor to different timestamps/prices.
- V4 can correctly say insufficient evidence while the UI still renders misleading price-sensitive entry levels.
- Research tabs are logically synchronized to V4, but they are not yet synchronized to one market truth object.

## Core invariant
For one rendered stock analysis, the following must share one `snapshotId` and `decisionPrice`:

`Header price = decision price = technical anchor = risk/reward anchor = action-plan anchor = valuation market-price anchor`.

If the invariant cannot be satisfied, AURYN must fail closed for price-sensitive output.

## Market Truth model
Create an immutable `CanonicalMarketSnapshot` containing:
- `snapshotId`
- `symbol`
- `asOf`
- `session`
- `calendarState`: OPEN / CLOSED / HOLIDAY / EARLY_CLOSE
- `priceState`: LIVE_VERIFIED / LIVE_SINGLE_SOURCE / OFFICIAL_CLOSE / UNVERIFIED / UNAVAILABLE
- `decisionPrice`
- `displayPrice`
- `regularClose`
- `extendedPrice`
- `providerAgreementPct`
- `sources[]` with provider, price, timestamp, age, freshness
- `priceSensitiveAllowed`
- `decisionAllowed`
- `reason`

## Session/calendar policy
AURYN must recognize weekends and U.S. equity market holidays. The initial implementation uses a deterministic NYSE/Nasdaq holiday calendar for 2026-2030, including observed holidays, plus early-close support. No weekday-only assumption may mark a holiday as REGULAR.

## Price policy
### Regular session
- Two fresh providers within tolerance -> LIVE_VERIFIED, usable.
- One fresh provider with no contradictory fresh provider -> LIVE_SINGLE_SOURCE, usable for display/analysis but lower confidence and not eligible for autonomous execution without separate execution-risk approval.
- Fresh providers outside tolerance -> UNVERIFIED; no displayed live price, no price-sensitive action plan.
- Only stale/delayed providers -> UNVERIFIED/UNAVAILABLE; no price-sensitive output.

### Closed session / holiday
- Use a verified regular close as `decisionPrice` when available.
- Extended-hours price may be displayed only as secondary context, never silently replace official close for long-horizon valuation/levels.
- If regular close is unavailable or conflicts materially across sources, price-sensitive output is blocked.

## Provider disagreement policy
Any material disagreement (>1.0% for normal U.S. equities by default, configurable) blocks live price selection. Extreme disagreement must never choose a provider merely because it is newer.

## Corporate-action sanity
Before using a provider price, compare it with recent daily bars / previous close. Large discontinuities require either a matching corporate-action context or a second confirming source; otherwise state becomes UNVERIFIED. This is a sanity gate, not split detection by guess.

## Decision policy
- AURYN may still publish a non-price-sensitive business/thesis assessment when market price is unverified.
- AURYN must not publish entry, add, trim, stop, target, risk/reward, or price-derived valuation conclusions when `priceSensitiveAllowed=false`.
- If price-sensitive evidence is required for the selected horizon, the action becomes `INSUFFICIENT_EVIDENCE` with a precise reason.
- A strong structural thesis must remain visible separately from temporary price verification failure.

## UI policy
One canonical stock header communicates:
- verified status
- as-of timestamp
- regular close when market closed
- provider integrity state

If market truth is blocked:
- do not render a giant suspect price
- render `PRICE UNVERIFIED` or `LAST VERIFIED CLOSE`
- suppress action-plan prices and R:R
- explain what is missing and what remains valid (business/thesis research)

All tabs consume the same snapshot context. No tab independently chooses a price.

## Trading policy
Paper/live execution may only consume `priceSensitiveAllowed=true` plus existing trading-risk gates. `MARKET_CLOSED`, `UNVERIFIED`, `UNAVAILABLE`, or holiday states are non-tradable.

## Tests required
- Labor Day 2026 is CLOSED/HOLIDAY.
- Thanksgiving and Christmas observed dates are closed.
- Early-close day transitions correctly.
- Fresh agreeing providers verify.
- Single fresh provider is explicit and lower confidence.
- 16% and 80% provider disagreements block price.
- Stale Alpaca + stale TwelveData never produce a chosen display price.
- Closed session uses verified regular close, not stale extended quote.
- SAP/ADR-like huge provider gap fails closed.
- Header/action-plan/decision-price invariant is enforced in source contract.
- Action plan is hidden when price-sensitive evidence is blocked.
- Existing decision, portfolio, and paper-trading suites remain green.

## Out of scope for V4.2
- Paid exchange reference feed.
- Automated corporate-action vendor integration.
- New ML model for return prediction.
- Live brokerage execution.
