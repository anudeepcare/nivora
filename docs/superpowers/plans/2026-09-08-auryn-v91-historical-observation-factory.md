# AURYN V9.1 Historical Observation Factory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic point-in-time historical observation factory that turns normalized replay data into compact base-observation JSONL and deterministic V9 candidate shards without modifying production decision/execution behavior.

**Architecture:** A new `lib/auryn/v91` research-only layer validates historical bundles, reconstructs point-in-time base metrics, labels all forward outcomes once, streams compact base observations, and materializes catalog candidates later in bounded deterministic shards. Existing V9 catalog/tournament modules are consumed but the production registry/CIO/broker remain read-only and untouched.

**Tech Stack:** TypeScript, Node.js, existing AURYN V9 catalog/tournament, existing technical/statistics helpers where point-in-time-safe.

**Spec:** `docs/superpowers/specs/2026-09-08-auryn-v91-historical-observation-factory-design.md`

## Global Constraints
- No future fact/event may influence an observation before its `availableAt`.
- No unadjusted price bundle may be labeled decision-grade.
- No incomplete forward horizon may be extrapolated.
- Missing historical evidence remains missing.
- Output must be deterministic for identical inputs/options.
- Research code must not modify production CIO weights, Market Truth, broker permissions, or the V9 production registry.
- JSONL is the canonical compact base-observation output; candidate feature observations are materialized in bounded deterministic shards for the V9 tournament.

---

### Task 1: V9.1 domain and dataset-quality audit

**Files:**
- Create: `lib/auryn/v91/domain.ts`
- Create: `lib/auryn/v91/quality.ts`
- Create: `lib/auryn/v91/version.ts`
- Test: `tests/auryn-v91-quality.test.mjs`
- Modify: `tsconfig.engine.json`

**Interfaces:**
- Consumes: normalized replay bundle supplied by CLI/tests.
- Produces: `HistoricalReplayBundle`, `HistoricalQualityReport`, `auditHistoricalBundle(bundle)`.

- [ ] **Step 1:** Add failing tests that reject invalid/unadjusted bars, detect missing survivorship guarantees, reject future-availability omissions on research facts, and grade a complete bundle `DECISION_GRADE`.
- [ ] **Step 2:** Run the focused tests and confirm RED because V9.1 modules do not exist.
- [ ] **Step 3:** Implement minimal strict domain types and deterministic quality audit.
- [ ] **Step 4:** Run focused tests and confirm GREEN.

### Task 2: Completed-session outcomes and point-in-time fact resolver

**Files:**
- Create: `lib/auryn/v91/point-in-time.ts`
- Create: `lib/auryn/v91/outcomes.ts`
- Test: `tests/auryn-v91-point-in-time.test.mjs`

**Interfaces:**
- Produces: `latestMetricAsOf`, `resolvePointInTimeMetrics`, `HORIZON_SESSIONS`, `labelForwardOutcome`.

- [ ] **Step 1:** Add failing tests proving later revisions are invisible before `availableAt`, horizon session mapping is exact, incomplete future paths are dropped, and benchmark/max-drawdown labels are deterministic.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Implement fact resolution and forward outcome labeling using completed adjusted bars only.
- [ ] **Step 4:** Confirm GREEN.

### Task 3: Historical base-metric engine

**Files:**
- Create: `lib/auryn/v91/base-metrics.ts`
- Test: `tests/auryn-v91-base-metrics.test.mjs`

**Interfaces:**
- Produces: `computeHistoricalBaseMetrics(symbolBars, benchmarkBars, facts, asOfIndex)` returning a sparse metric map plus regime.

- [ ] **Step 1:** Add failing tests for SMA/EMA trend, RSI, MACD, ATR/volatility, volume/flow, support/resistance, relative strength and point-in-time external fact passthrough.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Implement deterministic calculations using only bars/facts available through the current index/date.
- [ ] **Step 4:** Confirm GREEN.

### Task 4: Transform/context engine

**Files:**
- Create: `lib/auryn/v91/transforms.ts`
- Create: `lib/auryn/v91/contexts.ts`
- Test: `tests/auryn-v91-transforms.test.mjs`

**Interfaces:**
- Produces: `deriveTransformedSignal`, `applyResearchContext`.

- [ ] **Step 1:** Add failing tests for all eight V9 transforms and confirmation behavior that returns missing when context evidence is unavailable.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Implement transforms using historical-only metric series and context gating using same-date evidence.
- [ ] **Step 4:** Confirm GREEN.

### Task 5: Compact base-observation factory and manifest

**Files:**
- Create: `lib/auryn/v91/factory.ts`
- Test: `tests/auryn-v91-factory.test.mjs`

**Interfaces:**
- Consumes: `HistoricalReplayBundle`, V9 catalog/options.
- Produces: `buildHistoricalBaseObservations(bundle, options)` with compact `baseObservations` and `manifest`.

- [ ] **Step 1:** Add failing tests for deterministic multi-symbol base observations, no future leakage, missing metric omission, incomplete-horizon dropping, horizon counts, and production-boundary invariants.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Implement the sparse base-observation factory with explicit skip/missing counters and default cost policy.
- [ ] **Step 4:** Confirm GREEN.

### Task 6: Streaming CLI, candidate shard materializer, and V9 tournament handoff

**Files:**
- Create: `lib/auryn/v91/materialize.ts`
- Create: `scripts/run_v91_observation_factory.mjs`
- Create: `scripts/run_v91_materialize_shard.mjs`
- Modify: `scripts/run_v9_feature_tournament.mjs`
- Modify: `package.json`
- Test: `tests/auryn-v91-cli-contract.test.mjs`

**Interfaces:**
- Factory CLI: `npm run observations:v91 -- --input=/path/bundle.json --output=/path/base-observations.jsonl`
- Shard CLI: `npm run materialize:v91 -- --base=/path/base-observations.jsonl --output=/path/feature-observations.jsonl --candidate-start=0 --candidate-limit=500`
- Tournament: `npm run research:v9 -- --observations=/path/feature-observations.jsonl`

- [ ] **Step 1:** Add failing contract tests for scripts, package commands, deterministic catalog slicing, JSONL output/loader, manifest output and no production writes.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Implement compact factory CLI, deterministic candidate shard materializer, JSONL tournament loader, and sidecar manifests.
- [ ] **Step 4:** Confirm GREEN.

### Task 7: Release docs and verification

**Files:**
- Create: `AURYN_V9_1_RELEASE.md`
- Create: `docs/V9_1_HISTORICAL_REPLAY_CONTRACT.md`
- Modify: `README.md`
- Test: `tests/auryn-v91-release.test.mjs`

**Interfaces:**
- Documents the normalized bundle schema, quality meanings, commands and promotion boundary.

- [ ] **Step 1:** Add failing release contract test for V9.1 docs/commands/version surface.
- [ ] **Step 2:** Confirm RED.
- [ ] **Step 3:** Add exact release/data-contract documentation without claiming historical alpha before data is supplied.
- [ ] **Step 4:** Run `npm test`, `npm run test:v9-core`, V9.1 focused tests, `npm run audit:v8-reality`, and `npm run audit:v65`.
- [ ] **Step 5:** Package a clean production ZIP, extract it into a fresh directory, rerun all release gates, scan forbidden files/secrets, and record SHA-256.
