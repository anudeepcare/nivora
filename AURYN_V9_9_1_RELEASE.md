# AURYN V9.9.1 — Validation Integrity Patch

## Root causes fixed
1. V9.9 seeded the first 300 active market-universe symbols alphabetically. The first batch therefore contained AAC*/AA* names and derivative-like symbols rather than a representative scientific cohort.
2. The Shadow CIO worker accepted canonical snapshots whose research projection was `ANALYSIS_REQUIRED`; market price existed, but CIO fields were NULL. The worker incorrectly treated persistence as success.

## V9.9.1 behavior
- deterministic sector-stratified cohort from the full market universe
- excludes warrant/unit/right/preferred-like symbol forms
- requires READY canonical research
- requires new-money, owner, long-term, decision score, evidence completeness and setup state
- requires positive canonical market price
- missing required decision data fails closed and is retried; no NULL decision evidence is saved

## No changes
No UX, CSS, PWA, portfolio UI, investment formulas or CIO decision thresholds are intentionally changed by this patch.
