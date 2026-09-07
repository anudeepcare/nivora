# AURYN V5 Decision OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the first production V5 canonical decision system with synchronized research, a professional metric/pattern engine, one execution plan, and strict broker/market-truth gates.

**Architecture:** V5 wraps the proven V4 evidence collection and Market Truth layers in one immutable `CanonicalAnalysisSnapshot`. Specialist engines derive metrics, technical patterns, scenarios and an execution plan from that snapshot; a V5 CIO resolves the structural thesis, valuation state, timing and risk into one action. UI tabs and paper-execution gates consume the same snapshot id and never recalculate prices or levels independently.

**Tech Stack:** Next.js, React, TypeScript, Node test runner, existing AURYN/NIVORA quant utilities; no new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v5-decision-os-design.md`

## Global Constraints
- Preserve V4.2 Market Truth fail-closed behavior.
- Never convert missing evidence to 0.
- No new external dependency.
- Keep live-money execution disabled; paper execution remains the validation path.
- Every V5 level must carry the canonical market snapshot id.

---

### Task 1: V5 canonical domain and professional metric registry
**Files:** Create `lib/auryn/v5/domain.ts`, `lib/auryn/v5/metrics.ts`, `lib/auryn/v5/version.ts`; Test `tests/auryn-v5-domain-metrics.test.mjs`.
**Interfaces:** `ProfessionalMetric`, `CanonicalAnalysisSnapshot`, `buildProfessionalMetrics()`.
- [ ] Write failing tests for RSI overbought/oversold labels, inverse risk semantics, missing=N/A, and metric family/role metadata.
- [ ] Run focused test and verify RED.
- [ ] Implement V5 domain/version and metric builder using existing V4 factors + technical snapshot.
- [ ] Run focused test and verify GREEN.

### Task 2: Pattern, structure, scenario and confluence engines
**Files:** Create `lib/auryn/v5/technical-patterns.ts`, `lib/auryn/v5/scenarios.ts`; Test `tests/auryn-v5-pattern-scenarios.test.mjs`.
**Interfaces:** `analyzeTechnicalPatterns(bars, technical)`, `buildScenarioMap(...)`.
- [ ] Write failing tests for higher-low/reversal candidate, double-bottom candidate, breakout/base state, probabilistic wave context and deterministic bull/base/bear boundaries.
- [ ] Verify RED.
- [ ] Implement swing-point, RSI-series, MA/volume/volatility confluence and scenario logic without ticker rules.
- [ ] Verify GREEN.

### Task 3: One canonical execution plan
**Files:** Create `lib/auryn/v5/execution-plan.ts`; Test `tests/auryn-v5-execution-plan.test.mjs`.
**Interfaces:** `buildExecutionPlan({marketTruth, technical, thesis, patterns, riskScore})` -> one plan with initial entry, DCA1/2/3, confirmation, invalidation and targets.
- [ ] Write failing tests proving all ranges are ordered, use one snapshot id, disappear when market truth is unverified, and staged DCA never crosses invalidation.
- [ ] Verify RED.
- [ ] Implement volatility/structure/confluence-based zones with explicit confidence and thesis guard.
- [ ] Verify GREEN.

### Task 4: V5 CIO and canonical snapshot builder
**Files:** Create `lib/auryn/v5/cio.ts`, `lib/auryn/v5/analyze.ts`; Test `tests/auryn-v5-cio.test.mjs`.
**Interfaces:** `buildAurynV5Analysis(input)` returns `CanonicalAnalysisSnapshot` with one action/horizons/metrics/patterns/scenario/execution plan.
- [ ] Write failing tests for strong-thesis/weak-chart, missing valuation, broken thesis, extreme risk, and price-unverified cases.
- [ ] Verify RED.
- [ ] Implement hierarchical arbitration (truth gates -> structural thesis -> valuation/expected-return state -> timing -> risk -> CIO).
- [ ] Verify GREEN.

### Task 5: Synchronized stock UI and Evidence Explorer
**Files:** Create `components/stock/v5/StockV5Decision.tsx`, `components/stock/v5/ProfessionalMetricExplorer.tsx`, `components/stock/v5/ExecutionPlanPanel.tsx`; modify `components/StockClient.tsx`, `components/stock/StockTabContext.tsx`, `app/auryn-product.css`; Test `tests/auryn-v5-ui.test.mjs`.
**Interfaces:** UI consumes only `CanonicalAnalysisSnapshot` for call/levels/tab context.
- [ ] Write failing source-contract tests: no ENGINE/model-fit block in hero, one execution-plan component, tabs receive same snapshot, Extreme Pro exposes grouped metric explorer.
- [ ] Verify RED.
- [ ] Implement components and switch stock surface to V5 while preserving existing tab detail content.
- [ ] Verify GREEN.

### Task 6: Broker snapshot gate and 10,000-case reliability harness
**Files:** Modify `lib/nivora-trade-intent.ts`, `lib/nivora-paper-execution.ts` if required; create `lib/auryn/v5/reliability.ts`; Test `tests/auryn-v5-reliability.test.mjs`.
**Interfaces:** `validateV5ExecutionSnapshot()` and `runV5ReliabilityMatrix()`.
- [ ] Write failing tests for mismatched snapshot ids and stale/unverified prices.
- [ ] Verify RED.
- [ ] Implement snapshot-id gate and deterministic 10,000+ scenario matrix across price state, valuation availability, thesis state, risk, timing and ownership.
- [ ] Verify GREEN with >=10,000 cases and zero invariant violations.

### Task 7: Production verification and release package
**Files:** Update `README.md`, create `AURYN_V5_RELEASE.md` and `AURYN_V5_VERIFICATION.txt`.
- [ ] Run full `npm test`.
- [ ] Run `npm run audit:v65` and `git diff --check` equivalent whitespace check.
- [ ] Run `npm run build` if dependencies are present; otherwise record exact environment limitation.
- [ ] Package source excluding secrets, `.git`, `.next`, `node_modules`, `.engine-test`, caches.
- [ ] Re-run tests from packaged extraction and generate SHA-256.
