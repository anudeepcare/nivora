# AURYN 200-ticker integrity audit — 4 November 2026

## Results

200 predeclared tickers requested; 199 usable histories; 199 passed; 0 calculation failures; 1 unavailable (WBD: provider returned Data not found). 1,791 checks executed on the usable histories. Missing symbols were not replaced to improve the pass rate.

The sample is a convenience sample spanning technology, communications, finance, healthcare, energy, utilities, industrials and consumer companies. It is not random, survivorship-free or representative of the entire market. Some requested ticker identifiers may have changed; symbol mapping is not independently verified by the connector.

Each returned history has up to 500 daily observations. The fixed evaluation instant is 2026-11-04T00:00:00Z. Retrieval dates and SHA-256 hashes are retained per ticker in results.json. Raw provider responses are kept locally and excluded from Git.

## What passed

- Positive finite OHLC values, valid bar ranges and nonnegative volume.
- Unique observation dates.
- Latest close, SMA50 and SMA200 arithmetic.
- Separately recomputed Wilder RSI14.
- Fibonacci interpolation and bounds.
- Relative-volume baseline excluding the current observation.
- Future observations do not alter past Pace or technical readings.
- Pace history prefix invariance at three fixed cutoffs.
- Completed/forming month separation and allowed multiplier values.

The production modules were exercised without changing their policy thresholds. The reference RSI calculation uses a separate recurrence expression. Other arithmetic checks are direct formula checks, not independent provider reconciliation.

## Not verified

This is NOT a certification of every AURYN metric, prediction accuracy or strategy superiority. Financial statements, analyst targets, options/gamma, dividends, split-adjustment provenance and news require separate reconciliation. The connected Twelve Data cash-flow endpoint returned a plan-entitlement denial for APP. This checkout has no EODHD or Twelve Data server credentials configured. These limitations are not passes.

64 targeted regression tests for financial normalization, statements, business history, options and Pace contracts passed separately. Those tests use fixtures; they do not substitute for a live 200-company financial reconciliation.

## Competitor review

Reviewed DCA Optimizer public homepage and explanation page plus the user-supplied screenshots of Charts, Weekly Picks and Portfolio. Its app redirected this browser to sign-in; authenticated pages and Pro features were not independently exercised.

Sources: https://dcaoptimizer.com/ and https://dcaoptimizer.com/how-dca-works . Their zone algorithm is described as proprietary; matching its labels is not an accuracy test. No proprietary formula was inferred or copied.

## Reproduce

Run `node --experimental-strip-types scripts/audit-ticker-integrity.mjs verification/ticker-audit-20261104` from the repository with the locally retained raw responses. Review results.json and ticker-results.csv. The raw responses are licensed provider data and are not embedded into the public product.
