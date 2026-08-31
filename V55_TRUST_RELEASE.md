# NIVORA V55 — Trust, Calibration & Product Coherence

V55 does not claim a 9/10 proven investment edge. It raises the engineering ceiling toward that target by fixing trust infrastructure and product semantics.

## Added
- Versioned decision history (`engine_version`, `weights_version`, `valuation_version`, `archetype`).
- Benchmark-aware outcome fields for excess-return calibration.
- Calibration API segmented by engine version + archetype + score bucket, with 95% Wilson intervals.
- Public Methodology / Metric Guide explaining Thesis, Opportunity, Timing, Data Coverage, Street evidence, smart money, horizons, zones, vetoes and calibration.
- Legal/FAQ/About language synchronized with V55 semantics.
- Street target UX distinguishes missing target-price coverage from missing analyst ratings. No target is fabricated.
- Engine test command added to package scripts.

## Important boundary
The Python market scanner remains a universe research/candidate collector. It must not be presented as a second authoritative decision engine. User-facing company decisions come from the canonical TypeScript investor engine. A future release should move shared normalized factor computation into a language-neutral contract/service so scanner ranking and interactive decisions cannot drift.

## Still required before claiming A/A+ or autonomous capital use
- exact point-in-time estimate history and benchmark outcome grader;
- runtime behavioral fixtures + CI and property-based invariants;
- mature archetype valuation models (DCF/residual income/rNPV/NAV where appropriate);
- cross-sectional sector/universe percentiles without forced Buy/Sell quotas;
- factor-family correlation controls before PCA/orthogonalization;
- portfolio covariance/concentration layer;
- provider redundancy + distributed rate limiting + staleness observability;
- sufficient untouched forward track record and independent methodology review.
