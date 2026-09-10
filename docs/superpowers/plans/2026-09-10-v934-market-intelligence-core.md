# AURYN V9.3.4 Market Intelligence Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic multi-timeframe/session-aware market-intelligence core and make Research, Portfolio, Monitor/Alerts, and Trading Lab consume its canonical snapshot.

**Architecture:** Extend the existing Market Truth + completed-bar architecture rather than replacing it. Add pure multi-timeframe technical/zone engines and one canonical snapshot/projection layer; preserve strict execution separation and all historical/research gates.

**Tech Stack:** Next.js/React/TypeScript, Node test runner, Twelve Data + existing Alpaca adapter, existing AURYN Market Truth/DecisionSnapshot infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-10-v934-market-intelligence-core-design.md`

## Global Constraints
- AURYN only; do not introduce the old product name in user-visible copy.
- No paid AI/runtime dependency.
- Research stays usable across regular, premarket, after-hours, overnight-reference, weekend, holiday and early-close states.
- Confirmed 1D/1W technical state only changes on completed bars.
- Execution remains stricter than research and fails closed.
- Same canonical snapshot must power all app surfaces.
- Existing V8/V9.2/V9.3/V9.3.1 safety gates must remain green.

---

### Task 1: Multi-timeframe technical consensus
**Files:**
- Create: `lib/auryn/v934/domain.ts`
- Create: `lib/auryn/v934/indicators.ts`
- Create: `lib/auryn/v934/timeframes.ts`
- Test: `tests/auryn-v934-timeframes.test.mjs`

**Interfaces:**
- Consumes: ascending `Bar[]` point-in-time slices.
- Produces: `computeTimeframeTechnicalState(bars, benchmarkBars, timeframe)` returning confirmed technical consensus/components.

- [ ] Write tests proving deterministic output, formula fixtures, insufficient-history nullability, and distinct 4H/1D/1W states.
- [ ] Run tests and verify RED because V9.3.4 modules do not exist.
- [ ] Implement pure indicators and consensus with explicit component evidence.
- [ ] Run focused tests and verify GREEN.

### Task 2: Structural zone/action-map engine
**Files:**
- Create: `lib/auryn/v934/zones.ts`
- Test: `tests/auryn-v934-zones.test.mjs`

**Interfaces:**
- Consumes: completed daily/weekly bars + ATR.
- Produces: `buildStructuralPriceMap(...)` with entry zone, confirm, support, invalidation, T1/T2 and evidence.

- [ ] Write tests proving stable levels for identical bars, ATR-normalized clustering, monotonic action-map ordering, and evidence for each published level.
- [ ] Verify RED.
- [ ] Implement pivot/Fibonacci/MA/AVWAP-proxy/gap/touch clustering and deterministic scoring.
- [ ] Verify GREEN.

### Task 3: Canonical V9.3.4 intelligence snapshot
**Files:**
- Create: `lib/auryn/v934/intelligence-snapshot.ts`
- Create: `lib/auryn/v934/version.ts`
- Test: `tests/auryn-v934-snapshot.test.mjs`

**Interfaces:**
- Consumes: Market Truth, timeframe bar sets, benchmark bar sets, optional live preview bars.
- Produces: `buildAurynMarketIntelligenceSnapshot()` and deterministic fingerprint.

- [ ] Write tests for confirmed/live separation, stable fingerprint, session semantics, and action-map stability.
- [ ] Verify RED.
- [ ] Implement snapshot aggregation and versioning.
- [ ] Verify GREEN.

### Task 4: Twelve Data multi-timeframe provider adapter
**Files:**
- Create: `lib/auryn/v934/twelve-multitimeframe.ts`
- Modify: `app/api/analyze/[symbol]/route.ts`
- Test: `tests/auryn-v934-provider-contract.test.mjs`

**Interfaces:**
- Consumes: `TWELVE_DATA_API_KEY`, symbol/exchange hints, as-of session.
- Produces: completed/preview bar sets for 15m/1h/4h/1d/1w and V9.3.4 snapshot in analyze response.

- [ ] Write source-contract tests for required intervals, caching, completed-bar handling and no future-bar leakage.
- [ ] Verify RED.
- [ ] Implement batched/cached interval loader and wire into analyze route with fail-soft partial timeframe coverage.
- [ ] Verify GREEN.

### Task 5: Cross-surface canonical projections
**Files:**
- Create: `lib/auryn/v934/projections.ts`
- Modify: `app/api/decision/summaries/route.ts`
- Modify: `app/api/portfolio/pulse/route.ts`
- Modify: `app/api/trading-lab/evaluate/route.ts`
- Modify: `app/api/trading-lab/run-paper/route.ts`
- Test: `tests/auryn-v934-cross-surface.test.mjs`

**Interfaces:**
- Produces one summary identity containing `snapshotId`, price reference, confirmed states and action map.

- [ ] Write tests that fail when Portfolio/Monitor/Trading Lab can publish mismatched snapshot/levels.
- [ ] Verify RED.
- [ ] Wire projections; Trading Lab fails closed on snapshot mismatch.
- [ ] Verify GREEN.

### Task 6: Platform-wide clean intelligence UI
**Files:**
- Modify: `components/StockClient.tsx`
- Modify: `app/portfolio/page.tsx`
- Modify: `app/alerts/page.tsx`
- Modify: `app/trading-lab/page.tsx`
- Modify: `app/auryn-product.css`
- Test: `tests/auryn-v934-ui-contract.test.mjs`

**Interfaces:**
- Consumes canonical V9.3.4 projections only.
- Produces consistent Research/Portfolio/Monitor/Trading Lab visual language.

- [ ] Write tests for visible timeframe tape, always-visible action map, no KPI wall/duplicate verdict, and cross-surface snapshot identifiers in data attributes/source contracts.
- [ ] Verify RED.
- [ ] Implement compact editorial UX across all four surfaces.
- [ ] Verify GREEN.

### Task 7: V9.3.4 Reliability Lab and release gate
**Files:**
- Create: `tests/auryn-v934-session-matrix.test.mjs`
- Create: `tests/auryn-v934-reliability.test.mjs`
- Create: `scripts/run_v934_live_audit.mjs`
- Modify: `package.json`
- Create: `AURYN_V9_3_4_RELEASE.md`

**Interfaces:**
- Produces `npm run test:v934-core`, `npm run audit:v934-live`, and machine-readable audit report.

- [ ] Add session matrix, provider chaos, determinism, formula/level stability, cross-surface and no-price-bypass gates.
- [ ] Verify new release gate catches deliberate fixture violations.
- [ ] Run V9.3.4 focused suite.
- [ ] Run full AURYN regression and preserved V8/V9.2/V9.3/V9.3.1 gates.
- [ ] Package only after all available local gates pass; clearly report any production-build/live-provider validation that cannot be executed locally.
