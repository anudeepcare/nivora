# Independent Pace: inactive proposal

Status: source-only research prototype, not an active engine, not validated, not a replacement ready to ship. Nothing in application/runtime code imports this module. Existing engines and files are untouched. This work does not clear the provenance of the inherited runtime model.

## Origin and limits

This implementation was written from the elementary definition of linearly interpolated sample quantiles. It has no imports, learned parameters, fitted model, reference labels, calibration data or legacy policy dependencies. Tests use fabricated ascending prices only, not securities, external signals or historical comparison cohorts. No performance or parity claim follows from software tests.

No default lookback or percentile boundaries are supplied. The caller must explicitly propose them. The synthetic test's four-month window and 20/40/60/80 percentiles demonstrate arithmetic only: they are not recommended investment parameters, nor a user-approved policy. Any change to these values is a substantive change in behavior.

## Exact calculation

Input consists of exactly N consecutive completed monthly adjusted closes immediately before the observation month, in chronological order, plus a settled adjusted observation in the as-of month. The source must be EODHD, the currency identified, and the caller must attest that every value has the same verified split-and-dividend-adjusted basis. Do not mix a raw live quote with adjusted history. These flags cannot independently authenticate data; a production adapter would have to substantiate them using authorized data and verified exchange settlement/calendar rules.

Sort the N closes ascending. For each caller-supplied quantile q, compute h = q × (N − 1), then interpolate between sorted[floor(h)] and sorted[ceil(h)] using h's fractional part. Four strictly increasing thresholds divide five bands. At an exact threshold the observation belongs to the lower-price band. Collapsed thresholds withhold a stage.

Proposed mapping, preserving the direction of the user's vocabulary:

- P0: observation above the highest boundary; pause vocabulary.
- P1: next lower band; watch/hold vocabulary.
- P2: middle band; start-small vocabulary.
- P3: next lower band; gradual-add vocabulary.
- P4: lowest band; deepest-price-position vocabulary.

Those action words describe the requested stage taxonomy, NOT an instruction from this prototype. Output is only a numbered descriptive price band, with `instruction: null` and `validated: false` in every result. It never sizes a position or generates an order. Low price relative to prior prices does not establish undervaluation, business quality, safety or expected recovery. P0 is not a sell recommendation; P4 is not a buying recommendation.

## Failure and evidence behavior

Invalid or absent policy, missing currency/basis verification, nonpositive/nonfinite prices, future/stale-month observations, unconfirmed settlement, missing/duplicate/out-of-order months, insufficient/excess input history, or non-distinct boundaries produce `unavailable`, a reason, and no stage. Dates are strict ISO calendar dates. The as-of date is caller supplied, not system time, enabling deterministic historical research without look-ahead. The observation must equal the adapter-declared latest settled exchange session. The module requires a calendar evidence reference but does not independently compute exchange holidays, session boundaries or freshness; a production adapter must verify that declaration.

Successful results expose the exact boundaries, policy, history-through month, observation date and currency. Historical closes are a trailing price distribution, not a valuation model. The method has no earnings, balance-sheet, trend/volatility safeguard or future forecast. In a deteriorating company a falling price can remain in P4 indefinitely; a growing business can remain in P0. This is a known design limitation, not a signal to trade.

## Before any production switch

1. Confirm actual user-approved stage definitions and explicitly choose policy inputs.
2. Build and audit the authorized EODHD adjustment, completeness, settlement and freshness adapter. This prototype does not fetch data or verify provider licensing.
3. Independently assess financial behavior using authorized market data, corporate actions, missing histories, regime shifts and out-of-sample periods. Do not use restricted third-party signals or labels.
4. Review whether price-distribution-only stages serve the product at all; they may not.
5. Perform independent code/security/model review and obtain a deliberate release decision. Keep existing runtime out of any claim of an independent model until replaced through that process.

Tests cover arithmetic, band boundaries, scaling, invalid inputs, date/history checks and collapsed distributions. Passing them establishes implementation behavior only, not investment merit.

## Fail-closed adapter contract (added after independent review)

No stage is returned without a stock symbol/exchange identity matching the provider instrument ID, an ISO currency recognized by the runtime currency registry, a source evidence reference, a UTC retrieval timestamp no later than the as-of date and no earlier than the claimed latest settled session, completed-month verification, and an exchange-calendar evidence reference. The settled observation must match that declared latest session. Records in the payload must all refer to that instrument, currency and adjusted basis; the adapter is responsible for proving this before attestation.

Eligibility is deliberately not inferred from cheap prices. A separate eligibility assessment must explicitly say `eligible`, identify an independently defined policy, be assessed on the same as-of date and include evidence references. `unknown`, `ineligible`, absent or stale assessments withhold the stage. No default eligibility criteria, business-quality score or threshold is fabricated here. An eligible flag is a prerequisite assertion, not a quality judgment made by this module.

These controls validate contract consistency, not authenticity: a string reference is not proof of provider origin, a caller-supplied symbol is not a verified security master, and a caller-supplied eligibility flag is not audited financial research. An inactive evidence-only collector is now described in independent-pace-adapter-plan.md; it always withholds readiness. There is no production-ready adapter, registry lookup or eligibility assessor in this change. Tests deliberately identify their source, calendar and eligibility as synthetic. Production remains blocked until those independent verifiers exist and their evidence is reviewed.
