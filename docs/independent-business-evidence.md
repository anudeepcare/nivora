# Independent business evidence, version 1

Status: inactive pure module; no runtime import, fetch, database change or Pace integration. Its purpose is to organize supplied business evidence, not determine whether a stock is a good investment. Every result keeps `authenticity: not-verified`, `eligibility: not-determined` and `instruction: null`. No score, weights, confidence percentage, buy/sell decision, price forecast or default financial-quality cutoff exists.

## Scope and provenance

The first module covers explicitly classified ordinary nonfinancial operating companies only. Banks, insurers, REITs, pre-revenue biotech, commodity producers, utilities, mixed conglomerates and unknown classifications require separate reviewed modules. This is a coverage boundary, not a claim that those companies are poor investments.

Financial statements distinguish period income/cash flows from point-in-time balances; earnings and operating cash generation are not equivalent. This motivates separate evidence components rather than a combined score. [SEC financial statements guide](https://www.sec.gov/investor/pubs/begfinstmtguide.htm)

Narrative risk factors, management's discussion and statement notes supply context that numerical ratios alone cannot establish. The module accepts explicitly sourced reviewed risk observations; it does not infer absence of going-concern, covenant or litigation risk from missing data. [SEC guide to reading a 10-K](https://www.sec.gov/answers/reada10k.htm)

These sources support the evidence categories, not an SEC-endorsed investment policy. The formulas, validation contract and narrow implementation scope below are an explicit Auryn proposal. No third-party investment signals, legacy classifiers, calibration labels or fitted parameters are imported. Tests are synthetic, not hand-reconciled issuer filings.

## Required contract

Each fact identifies issuer and security/share class; original numeric value; unit/currency; fiscal start/end and annual-versus-instant scope; accounting basis; reported/derived/adjusted/estimated representation; restatement version, definition and declared comparability group; and source URL/accession plus publication and retrieval dates. Publication must be explicitly reported, never the normalizer's retrieval-date fallback. Dates must be consistent and known by the caller's as-of date. HTTPS sources with embedded credentials or token-like query parameters are rejected.

The caller must explicitly name a review-policy ID, expected current/prior annual period ends, nonempty critical fact requirements and critical risk topics. There is no universal freshness-days default. Missing expected periods or critical evidence yields no-assessment. A request cannot manufacture an approved investment policy merely by naming one: the policy ID and all source metadata remain caller declarations, not verified authenticity or approval.

Only directly reported, explicitly comparable facts are calculated in this version. Management-adjusted, estimated, derived or unreconciled facts are withheld rather than mixed with reported statements. Annual durations are restricted to calendar-year or 52/53-week periods (364/365/366/371 inclusive days); stub and multiyear periods require separate comparison. Consecutive years must meet at the same fiscal boundary. Period lengths remain visible and calculations are not normalized for an extra week or day.

A mismatch in identity stops assessment. Duplicate facts for a metric/period are not arbitrarily selected. Currency, definition, accounting or reconciliation-group conflicts across critical inputs also withhold assessment. Quarterly/YTD/TTM calculations and segment aggregation are not implemented; feed the intended annual observations rather than combining scopes. No currency conversion or split adjustment is inferred.

## Descriptive arithmetic

Every result preserves its constituent facts, dates and sources, unit and exact formula. Display values are rounded to twelve significant digits after finite arithmetic checks.

- Revenue growth: `(current / prior − 1) × 100`, only with positive prior revenue.
- Revenue per diluted weighted-average share growth: compare the two revenue/share ratios; both share counts and prior revenue must be positive, with matching split-comparable share definition/class.
- Operating margin: operating income / positive revenue.
- Operating cash flow: reported amount, not an earnings proxy.
- Simple free cash flow: CFO minus explicitly positive cash capital expenditure under the exact `cash-capex-outflow-positive-excluding-business-acquisitions` definition. This means reported cash operating-asset purchases (PPE and explicitly included capitalized intangibles), excluding business acquisitions, securities purchases and noncash additions. Total investing cash flow or an ambiguous bundled acquisition line is not a substitute. Signed/ambiguous capex is not silently made positive. This is not an issuer-adjusted FCF definition and does not imply all commitments are funded.
- Cash conversion: CFO / positive net income; zero/negative earnings do not generate a misleading conversion ratio.
- Net debt: explicitly gross interest-bearing debt minus unrestricted cash and equivalents. Restricted/ambiguous cash is not relabeled available liquidity.
- Diluted share growth: compare the same split-comparable diluted weighted-average share measure. Period-end/basic/weighted-average counts are not interchangeable.
- Stock compensation/revenue: descriptive reported amounts only; no acceptable-dilution threshold is imposed.

Zero is retained when reported. Missing/nonfinite data is never replaced by zero. Undefined or overflowing arithmetic returns unavailable, not an extreme fabricated result. Each monetary result uses its own inputs' currency rather than borrowing the revenue currency. Missing facts, non-comparable facts and observed calculations have distinct states.

## Risks and overall status

A material-risk observation requires matching identity, topic, explicit status, a summary, source and a review date equal to the caller's as-of date. Its source must be published no earlier than the explicitly expected current period end. Missing, duplicate, stale-scope or unknown observations remain unknown. “Not identified in reviewed scope” is only a supplied review declaration, never “risk-free.” A dated disclosed issue sets `reviewRequired`, not an automatic sale or ineligibility.

`coverage` counts available required facts, not quality or confidence. `evidence-summary` means the requested critical evidence contract is present and consistent; it is NOT a passing business assessment. Other optional measures can remain unavailable. `no-assessment` means critical evidence is missing/conflicting or the business model is unsupported. Eligibility always remains not-determined.

## Deliberate omissions and release gates

No moat, segment/customer concentration score, forward growth, solvency prediction, runway, universal interest-coverage cutoff, debt-maturity forecast or portfolio recommendation is inferred. Cash balances alone do not prove financial resilience. Required commitments/maturity/concentration/disclosure evidence must be added under a separately reviewed policy; narrative risk topics can carry provided dated evidence but are not automatically extracted or authenticated here.

Existing normalized application facts are not enough to certify these contracts: filing-date fallbacks, capex sign normalization, lost share-class definitions and missing restatement provenance must be resolved at ingestion. Actual SEC/provider contracts, primary-filing hand reconciliation and an independently approved business policy are future work. Synthetic tests establish software behavior only. No runtime switch or investment eligibility follows from this module.


## Closed-output and restatement notes

All copied evidence fields must be schema primitives. Share-basis metadata is a nonempty string even for monetary facts (use an explicit not-applicable label); source URLs must be primitive strings, not coercible objects. Nested arbitrary objects are rejected before copying, so frozen wrappers cannot conceal mutable metadata. Returned fact/source objects and arrays are frozen.

`restatementVersion` is retained provenance, not a proof derived by this module. Annual filings can legitimately have different version labels. Cross-period comparison requires the supplied common `comparabilityGroup` and `reconciliation: comparable` declaration plus period/unit/definition checks; those declarations are caller attestations, not independent verification of restatement reconciliation. An actual source adapter and primary-filing review must substantiate them before any production assessment.
