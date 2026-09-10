# AURYN V9.3 — Deterministic Feature Tournament Design

## Goal
V9.3 converts the existing V9 research catalog into a reproducible, full-catalog scientific tournament. Every one of AURYN's 46,464 feature hypotheses receives a deterministic disposition, and no feature can become a V9.4 model candidate unless it passes chronological out-of-sample, purged walk-forward, transaction-cost, robustness, bootstrap-confidence and global false-discovery gates.

## Milestone and release rule
One version = one measurable milestone + one automated acceptance gate.

**Milestone:** process the canonical 46,464-hypothesis catalog against point-in-time V9.1 observations sourced from a V9.2 decision-grade replay and produce a machine-readable tournament report plus V9.4 survivor registry.

**Pass rule:** the gate may pass with zero survivors. It may not pass if any survivor fails a required gate, if the global catalog was not dispositioned exactly once, if the run is nondeterministic, or if the upstream V9.2/V9.1 data provenance is not decision-grade.

## Safety boundary
V9.3 is research-only. It does not change CIO weights, setup labels, execution plans, portfolio policy, Market Truth, broker permissions or the production feature allowlist. A V9.3 survivor is only a `V94_CANDIDATE`.

## Inputs
- Canonical catalog from `lib/auryn/v9/feature-registry.ts` — exactly 46,464 deterministic IDs.
- Compact V9.1 base-observation JSON/JSONL containing point-in-time metrics, sector, archetype, regime, benchmark-relative forward outcomes and transaction-cost assumptions.
- V9.1 manifest proving source dataset identity and quality.
- V9.2 replay bundle for the strict release gate so `audit:v92-data` can be rerun before V9.3 is allowed to pass.

## Evaluation model
### Observation edge
For each directional feature observation:

`rawAlpha = forwardReturnPct - benchmarkReturnPct`

`edge = sign(signal) * rawAlpha - costBps / 100`

A second cost-stress edge is calculated using 2x transaction cost. Missing/zero/non-finite signals are excluded rather than coerced to neutral evidence.

### Purged expanding walk-forward
For each feature, observations are ordered by `asOf`, then symbol. The first 50% of unique dates form the initial research history. The remaining dates are divided deterministically into four chronological OOS folds. Training history expands before each fold; rows whose forward label window can overlap the test period are removed using a horizon-specific purge interval. There is no random fold assignment.

The union of the four test folds is the canonical OOS set. Promotion evidence is measured from OOS rows, not from in-sample rows.

### Required metrics
Each feature result records:
- total, training and OOS sample counts;
- number of valid walk-forward folds and per-fold mean edge;
- OOS benchmark-relative cost-adjusted alpha;
- OOS 2x-cost-stress alpha;
- deterministic bootstrap 95% CI of OOS alpha;
- OOS information coefficient;
- OOS hit rate;
- average forward max drawdown;
- regime breadth and positive-regime percentage;
- archetype breadth and positive-archetype percentage;
- sector breadth and positive-sector percentage;
- positive-fold percentage;
- p-value used for global multiple-testing correction.

## Determinism
- Policy constants are versioned in code.
- Base random seed is fixed.
- Per-feature bootstrap seed is derived deterministically from feature ID plus the base seed.
- Stable sorting is used everywhere.
- Numeric outputs are rounded at defined boundaries.
- Report hashes exclude wall-clock timestamps.
- The strict gate runs the same full tournament twice and requires identical deterministic hashes.

## Multiple testing
Benjamini-Hochberg correction is applied once across the complete intended 46,464-hypothesis family. Candidates with no/insufficient evidence carry `pValue=1`, remain in the correction scope and cannot become survivors. Partial shards may be used for development, but they cannot produce a V9.3 release-pass report.

## Promotion policy
A feature becomes `V94_CANDIDATE` only when every required gate passes:
- minimum 240 total observations;
- minimum 80 OOS observations;
- all four walk-forward folds valid, each with at least 15 OOS observations;
- positive OOS mean edge after stated costs;
- positive OOS mean edge under 2x cost stress;
- bootstrap 95% lower bound above zero;
- OOS IC >= 0.02;
- OOS hit rate >= 52%;
- >= 75% of walk-forward folds positive;
- >= 2 regimes with >= 60% positive-regime stability;
- >= 2 archetypes with >= 60% positive-archetype stability;
- >= 2 sectors with >= 60% positive-sector stability;
- average forward max drawdown no worse than -25%;
- global BH q-value <= 0.05.

These thresholds are policy constants and are emitted into every run manifest.

## Dispositions
Every catalog feature receives one primary deterministic disposition and a complete blocker list:
- `REJECTED_NO_EVIDENCE`
- `REJECTED_SAMPLE`
- `REJECTED_WALK_FORWARD`
- `REJECTED_OOS`
- `REJECTED_COST`
- `REJECTED_ROBUSTNESS`
- `REJECTED_FDR`
- `V94_CANDIDATE`

Primary rejection reason uses the priority order above; blockers retain all failures.

## Outputs
A full run writes:
- `auryn-v93-tournament-report.json` — policy, provenance, catalog coverage, counts, all candidate results, FDR scope and deterministic hash input;
- `auryn-v93-survivor-registry.json` — only `V94_CANDIDATE` IDs plus their evidence summary; explicitly not a production registry;
- `auryn-v93-rejections.jsonl` — rejected feature IDs, primary disposition and blockers;
- `auryn-v93-run-manifest.json` — input hashes, dataset identity, seed, policy version, code version and deterministic report hash.

## Acceptance gate
`gate:v93 -- --require-data` must automatically prove:
1. V9.3 core tests pass.
2. Full AURYN regression passes.
3. V8 Reality Audit passes.
4. V65 production/dead-code audit passes.
5. V9.2 strict real-data audit passes on the supplied replay bundle.
6. V9.1 manifest is `DECISION_GRADE`, survivorship-safe and adjusted-price verified.
7. Exactly 46,464 canonical IDs are present exactly once in the tournament report.
8. Global FDR scope is exactly 46,464.
9. Every `V94_CANDIDATE` passes every promotion gate.
10. No production registry or CIO path is mutated.
11. Two complete identical-input runs produce the same deterministic report hash.

Only after all eleven conditions pass may V9.3 close and V9.4 begin.
