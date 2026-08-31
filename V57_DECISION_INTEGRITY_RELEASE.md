# NIVORA V57 — Decision Integrity + Explainability

V57 is a trust/consistency release. It does not claim new predictive accuracy.

## Core changes
- Missing valuation/evidence is N/A, not 0/100 bearish evidence.
- Opportunity and 6M/1Y horizon formulas re-normalize around actually available evidence.
- Factor availability is explicit in the canonical decision object.
- Street Target disappears from prime decision space when no verified target exists.
- NIVORA-vs-Street disagreement exposes concrete reasons instead of showing conflicting cards with no explanation.
- Horizon badge is suppressed when every horizon is below constructive; scores under 60 are no longer called BEST.
- Major cockpit/factor metrics include explainability controls and a shared metric dictionary.
- Portfolio correlation is wired to cached trailing daily-return history for the largest funded positions; concentration can produce NORMAL / REDUCED / BLOCK ADD sizing gates without changing the company thesis.
- Canonical browser decisions are written to the versioned decision ledger as v57 observations so calibration can eventually evaluate the same engine users see.
- Factor-correlation audit foundation detects highly correlated signal families before future residualization/PCA work.
- Health endpoints now identify V57 and expose non-redundant provider capabilities honestly.
- About, FAQ, Methodology, Terms, Privacy and Disclaimer language synchronized to V57 semantics.

## Validation
`npm test` runs V56 behavioral tests plus V57 integrity tests. V57 adds checks for missing-valuation neutrality, no fabricated Street target and factor-correlation detection.

## Still intentionally incomplete
- Model Reliability remains uncalibrated/collecting until version-matched benchmark-relative outcomes mature.
- Archetype valuation remains preliminary for supported groups and N/A for unsupported groups.
- Provider redundancy is still incomplete for several capabilities.
- Options GEX/IV skew, full VaR, advanced factor orthogonalization and deeper archetype models remain later work.
