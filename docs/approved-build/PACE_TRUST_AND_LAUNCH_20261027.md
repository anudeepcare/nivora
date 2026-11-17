# AURYN Pace: verification and launch decisions

The product promise is understandable, reproducible accumulation guidance. A prominently displayed P4 is a price-based accumulation level, not a guarantee about business quality or future returns. The overall assessment must explain any restriction on adding while leaving both forming and confirmed Pace visible.

## What this correction establishes

- Research, watchlists, comparisons and discovery retain both available Pace periods without an expand action. Home and portfolio summaries retain the confirmed Pace even when the overall view is Wait or Hold.
- Confirmed and forming readings retain independent dates. The confirmed calculation reason is visible on the main research card; the history tool identifies its model version.
- Strategy Lab previously evaluated `monthly-v1` while the main product used `monthly-v5`. It now uses the same active policy, settled observations and next-period execution convention. A regression compares its accounting and each applied level to the current model/evaluator.
- No Pace thresholds were retuned in this correction. `lib/accumulation-policy-v5.ts` and the evaluation engine are unchanged.
- Corporate calendars retain actual EPS, including zero and losses. A date or a before-market slot alone does not prove release. Multiple same-day reports have individual visible states. Reported events leave future earnings exposure and approaching alerts.
- Reported results do not imply that financial statements and valuation have already incorporated the quarter. Financial metrics retain their statement dates; research should be read alongside the official release until those dates advance.
- Home and mounted Portfolio calendars revalidate while visible and on return. Earnings reads use five-minute caches, a new cache namespace and no third Next fetch cache retaining an old six-hour response. Source publication delays remain possible.

## Evidence boundaries

`scripts/validate-pace-integrity.mjs` verifies five synthetic regimes at two cost settings, equal deposits, no negative cash and signal-before-execution. This is a mechanics check, not performance evidence.

The existing `verification/dca-backtest-30.json` and `verification/dca-frozen-validation.json` identify a different policy source hash. Their stored results are not results of the present implementation. They do not justify a claim that current Pace beats fixed DCA or the market. The integrity report records this mismatch explicitly.

Before making such a claim, freeze the implementation and source data, obtain licensed split/dividend-adjusted historical inputs including delisted instruments, reserve genuinely independent periods/universes, compare equal-cash budgets against fixed DCA and other stated benchmarks, include costs and cash interest, and report losses, drawdowns, coverage and sensitivities as well as wins. Retain reproducible input and output fingerprints. Do not choose thresholds or showcase tickers after seeing evaluation outcomes.

Production/preview parity requires matching the model revision, cadence, price-history adjustment basis, settlement cutoff, dates, complete history and input snapshot. Synthetic preview quotes are intentionally not production quotes. This patch does not claim that a live production snapshot was independently retrieved or reconciled.

## Legal and commercial launch decisions

These are unresolved operational decisions, not legal clearance from a source-code check.

1. **Investment-adviser analysis.** Have qualified securities counsel assess the actual paid product, holdings-dependent Buy/Add/Hold/Reduce/Sell outputs, marketing, jurisdictions and registration/exemption position. The SEC's publisher exclusion guidance describes impersonal advice and other requirements; a disclaimer alone does not settle how AURYN is classified. Primary reference: https://www.sec.gov/files/divisions/investment/iaregulation/memoia.htm
2. **Market-data rights.** Confirm written rights for external commercial display, derived signals, charts, storage, historical evaluation, exchange entitlements and any redistribution. EODHD distinguishes non-commercial personal use from business use. Twelve Data requires external-display/redistribution authorization and applicable attribution. Removing provider names everywhere is appropriate only where the contracts permit it; obtain a white-label waiver if needed. References: https://eodhd.com/financial-apis/terms-conditions ; https://twelvedata.com/terms ; https://support.twelvedata.com/en/articles/12647398-attribution-guidelines-for-using-twelve-data
3. **Privacy and tracking.** Source checks cover consent-gated analytics, sanitized event data and revocation. Production must also use the correct GA configuration, with Enhanced Measurement and automatic sensitive route/form collection disabled, and maintain an accurate service-provider inventory, operator identity, retention rules, deletion/access workflow and incident process. Follow WEBSITE_ACTIVATION_20261027.md; code tests do not certify the live console configuration.
4. **Claims and support.** Use support@auryninvest.com consistently. Keep hypothetical models and historical results labelled. Do not promise loss-free decisions, universal coverage, legal compliance or investment outperformance. Confirm legal entity details and review the deployed Terms, Privacy, Methodology and Risk disclosures against the actual service before public commercial launch.

## Confirmed incident

SoFi's official October 27, 2026 results release confirms the user's report. The old Home copy was incorrect after release; the bug was the discarded reported-result field and date-only editorial branch, compounded by long caching. Official source: https://investors.sofi.com/news/news-details/2026/SoFi-Reports-Third-Quarter-2026-with-Record-Net-Revenue-of-1-4-Billion-Net-Income-of-241-Million-and-Raises-Full-Year-Guidance/default.aspx

No production deployment, data-provider contract acceptance, analytics activation, account change or external message was performed by this correction.
