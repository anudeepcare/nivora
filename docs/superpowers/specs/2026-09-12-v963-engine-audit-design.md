# AURYN V9.6.3 Decision + Scenario Audit Design

## Goal
Add deterministic, machine-readable diagnostics that measure whether the production decision policy is over-concentrated in WAIT and whether scenario values are excessively anchored to current price, without changing production decision thresholds.

## Scope
The audit is observational only. It must not loosen BUY gates, manufacture action diversity, alter score weights, or change scenario values.

## Inputs
A JSON array of captured production decision rows. Each row may include symbol, newMoneyAction, ownerAction, longTermAction, opportunityScore, entryQuality, evidenceQuality, decisionScore, hardVetoReasons, policyReasons, closestPath, distanceToBuy, currentPrice, bearValue, baseValue, bullValue, and snapshot identifiers.

## Outputs
A deterministic JSON report containing:
- New-money action distribution.
- Owner-action and long-term-action distributions.
- Opportunity, Entry Quality and Evidence Quality histograms.
- Dominant hard vetoes and policy blockers.
- Closest-to-upgrade rows with distance and primary blocker.
- Contradiction counts (e.g. ATTRACTIVE + AVOID, high evidence + AVOID, strong opportunity + WAIT).
- Scenario anchoring bands: percentage with Base within ±2%, ±5%, ±10% of spot.
- Bull/base/bear spread statistics and invalid geometry counts.
- A decision-dispersion diagnostic that flags concentration but does not prescribe a target BUY percentage.
- A scenario-independence diagnostic that flags suspicious anchoring but does not modify scenario generation.

## Determinism
The same input file must produce byte-stable canonical metrics except for `generatedAt`; a fingerprint is computed from the canonical report body.

## Release Position
V9.6.3 records the baseline only. V9.7 may recalibrate policy only after reviewing this report across a diverse real-market universe.
