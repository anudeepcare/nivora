# AURYN V9.3 Deterministic Feature Tournament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing V9 research plane into a full-catalog, deterministic, purged walk-forward Feature Tournament that emits a machine-gated V9.4 survivor registry.

**Architecture:** Keep V8/V9.2 production and Market Truth boundaries untouched. Add `lib/auryn/v93/*` as the scientific tournament layer, reuse the canonical V9 catalog and V9.1 materializer, evaluate shards deterministically, then apply one global BH correction across all 46,464 hypotheses before creating a research-only V9.4 candidate registry.

**Tech Stack:** TypeScript, Node test runner, existing AURYN V9/V9.1/V9.2 research utilities, Node CLI scripts.

**Spec:** `docs/superpowers/specs/2026-09-08-auryn-v93-deterministic-feature-tournament-design.md`

## Global Constraints
- Canonical hypothesis count is exactly 46,464.
- V9.3 is research-only and must not mutate the production registry, CIO, Market Truth or broker path.
- Point-in-time V9.2/V9.1 evidence is mandatory for a strict release pass.
- OOS evidence is purged, chronological and fold-based.
- Global Benjamini-Hochberg correction covers the complete 46,464-hypothesis family.
- Fixed policy version and seed make identical inputs reproducible.
- Zero survivors is a valid scientific outcome; an invalid survivor is not.

---

### Task 1: V9.3 domain, policy and fold generator
**Files:**
- Create: `lib/auryn/v93/domain.ts`
- Create: `lib/auryn/v93/policy.ts`
- Create: `lib/auryn/v93/folds.ts`
- Create: `lib/auryn/v93/version.ts`
- Modify: `tsconfig.engine.json`
- Test: `tests/auryn-v93-folds.test.mjs`

**Interfaces:**
- Produces: `V93_POLICY`, `createPurgedWalkForwardFolds(rows, horizon, policy)`, V9.3 result/fold types.

- [ ] Write failing tests proving four deterministic chronological folds, horizon-aware purging and no train/test label-window overlap.
- [ ] Run the focused test and verify RED.
- [ ] Implement the minimal V9.3 types, policy constants, version and fold generator.
- [ ] Run the focused test and verify GREEN.

### Task 2: OOS metrics, cost stress and robustness
**Files:**
- Create: `lib/auryn/v93/metrics.ts`
- Modify: `lib/auryn/v9/domain.ts`
- Modify: `lib/auryn/v91/materialize.ts`
- Test: `tests/auryn-v93-metrics.test.mjs`

**Interfaces:**
- Consumes: `createPurgedWalkForwardFolds`, V9 `FeatureObservation`.
- Produces: `evaluateV93Feature(featureId, observations, policy)` with OOS bootstrap CI, IC, hit rate, fold/regime/archetype/sector stability, drawdown and 2x-cost stress.

- [ ] Write failing tests for OOS-only metrics, 2x-cost rejection evidence, fixed-seed bootstrap repeatability and sector/archetype stability.
- [ ] Run and verify RED.
- [ ] Add optional `sector` to `FeatureObservation` and propagate it from V9.1 base observations.
- [ ] Implement deterministic V9.3 metric evaluation.
- [ ] Run and verify GREEN.

### Task 3: Global FDR and deterministic dispositions
**Files:**
- Create: `lib/auryn/v93/promotion.ts`
- Create: `lib/auryn/v93/tournament.ts`
- Test: `tests/auryn-v93-tournament.test.mjs`

**Interfaces:**
- Consumes: preliminary V9.3 metrics for canonical IDs.
- Produces: `finalizeV93Tournament(catalog, metrics, policy)` with exactly one disposition per canonical feature and `V94_CANDIDATE` only when every gate passes.

- [ ] Write failing tests proving insufficient/in-sample-only/high-cost/unstable/FDR-losing features are rejected and a robust feature becomes `V94_CANDIDATE`.
- [ ] Verify RED.
- [ ] Implement blocker policy, primary rejection ordering and one global BH correction scope.
- [ ] Verify GREEN.

### Task 4: Full-catalog runner, hashes and artifacts
**Files:**
- Create: `lib/auryn/v93/runner.ts`
- Create: `lib/auryn/v93/report.ts`
- Create: `scripts/run_v93_feature_tournament.mjs`
- Test: `tests/auryn-v93-runner.test.mjs`
- Test: `tests/auryn-v93-cli-contract.test.mjs`

**Interfaces:**
- Consumes: V9.1 base observations + manifest, canonical catalog.
- Produces: full 46,464 dispositions and the four V9.3 artifact files.

- [ ] Write failing tests for exact catalog coverage, stable result ordering, deterministic report serialization/hash input, research-only survivor registry and CLI artifact contract.
- [ ] Verify RED.
- [ ] Implement shard-based full-catalog execution and deterministic canonical serialization.
- [ ] Implement CLI with `--base`, `--manifest`, `--output-dir`, `--candidate-limit` development override and fixed-policy metadata.
- [ ] Verify GREEN.

### Task 5: Strict release audit and double-run determinism
**Files:**
- Create: `scripts/audit_v93_report.mjs`
- Create: `scripts/run_v93_release_gate.mjs`
- Test: `tests/auryn-v93-release-gate.test.mjs`
- Modify: `package.json`
- Create: `AURYN_V9_3_RELEASE.md`
- Modify: `README.md`

**Interfaces:**
- Produces: `npm run research:v93`, `npm run audit:v93-report`, `npm run test:v93-core`, `npm run gate:v93`.

- [ ] Write failing contract tests requiring full-catalog scope, no duplicate/unknown IDs, all survivor gates true, V9.2 strict prerequisite, two-run deterministic hash equality and no auto-production promotion.
- [ ] Verify RED.
- [ ] Implement report audit and release-gate orchestration.
- [ ] Add package scripts and release documentation.
- [ ] Verify GREEN.

### Task 6: Regression and exact-package verification
**Files:**
- Modify only if verification exposes a real defect.

- [ ] Run `npm run test:v93-core`.
- [ ] Run `npm test`.
- [ ] Run `npm run audit:v8-reality`.
- [ ] Run `npm run audit:v65`.
- [ ] Run `npm run gate:v93` without real data and verify it reports code readiness but does not claim the milestone passed.
- [ ] Package a clean V9.3 ZIP without caches/secrets.
- [ ] Extract the exact ZIP to a clean directory and rerun focused V9.3 plus full regression/safety gates.
- [ ] Record exact pass counts, remaining real-data blocker and SHA-256 in the final handoff.
