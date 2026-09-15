# AURYN Portfolio + Decision Visual Integrity Design

## Goal
Improve navigation and visual readability while correcting misleading/static semantics in Position Matrix, Decision Map, and Scenario Spectrum without changing canonical CIO formulas unless an audit proves a consumer is misusing them.

## Approved scope
- Portfolio tabs: sticky navigation, click-to-section, scroll-spy, mobile active-tab auto-scroll.
- Performance: stronger Portfolio line/area hierarchy; benchmarks subordinate; never hide suspicious source data.
- Position Matrix: X = portfolio weight, Y = total return %, bubble size = position value; AURYN owner-action color; deterministic collision avoidance; richer hover/tap detail; Research navigation.
- Decision Map: preserve canonical levels, normalize marker positions from actual prices, remove hard-coded ACCUMULATION, derive neutral/action-aware zone language from existing canonical state only, improve rail/node/current-marker readability.
- Scenario Spectrum: audit inputs first; normalize Bear/Base/Bull/Current from actual values; preserve “Decision-grade values · not probabilities”; never artificially spread points; improve rail/node/current-marker readability.
- Autonomous workflows: preserve and verify existing validation/market-cycle workflows and canonical secret names.

## Correctness constraints
No ticker-specific fixes. Market Truth/session architecture stays untouched. CIO formulas, thresholds and decision semantics stay unchanged unless a separate demonstrated calculation defect is approved. No fabricated portfolio history, prices, scenarios, probabilities, or opportunity data. Styling must not conceal the separate Today P/L correctness issue.

## Validation
Add focused tests for navigation anchors, matrix geometry/collision behavior, Decision Map normalization/zone copy, Scenario Spectrum normalization, and workflow preservation. Existing release gates and production build must pass. Perform desktop/mobile visual smoke checks.
