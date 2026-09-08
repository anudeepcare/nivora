# AURYN V6 9+ Proof OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the proof, validation, multi-timeframe, portfolio-CIO, valuation-method and promotion-gate layers that move AURYN from V5.1 reliability toward professional-grade 9+ decision discipline.

**Architecture:** Preserve V5.1 Market Truth and canonical decision/execution flow. Add V6 as a thin institutional layer over V5.1: proof evidence never mutates production coefficients, portfolio context never rewrites company thesis, and exact-engine historical outcomes determine model-health status separately from current evidence confidence.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase/Postgres, Node test runner, existing AURYN V5/V65 engines.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v6-nine-plus-proof-os-design.md`

## Global Constraints
- Preserve V5.1 Market Truth fail-closed behavior.
- No live-money autonomous execution.
- No fake probability language from evidence confidence.
- No production self-tuning or auto-promotion.
- Missing valuation remains unavailable/partial, never zero-by-default.
- Portfolio overlay changes sizing/user action only, never the independent company thesis.
- All V6 user-facing values use centralized V5.1 formatting rules.
- Exact engine/outcome evidence is required for proof grades above UNPROVEN.

---

### Task 1: V6 domain, version and proof model
**Files:**
- Create: `lib/auryn/v6/domain.ts`
- Create: `lib/auryn/v6/version.ts`
- Create: `lib/auryn/v6/proof.ts`
- Test: `tests/auryn-v6-proof.test.mjs`

**Interfaces:**
- Produces `ModelProofSummary`, `ActionLadderAssessment`, `PromotionGate`, `summarizeModelProof()`.

- [ ] Write failing tests for UNPROVEN/EMERGING/VALIDATED/ELITE grades, action-ladder monotonicity and promotion blockers.
- [ ] Run focused test and confirm RED.
- [ ] Implement pure proof aggregation and promotion policy.
- [ ] Run focused test and confirm GREEN.

### Task 2: Multi-timeframe technical regime
**Files:**
- Create: `lib/auryn/v6/timeframes.ts`
- Test: `tests/auryn-v6-timeframes.test.mjs`

**Interfaces:**
- Consumes verified daily `Bar[]`.
- Produces `MultiTimeframeTechnical` with daily, weekly and alignment state.

- [ ] Write failing tests for deterministic weekly aggregation and aligned/conflicted regimes.
- [ ] Run RED.
- [ ] Implement Monday-Friday week aggregation and reuse `computeTechnicalSnapshot()` for weekly structure.
- [ ] Run GREEN.

### Task 3: Valuation method registry
**Files:**
- Create: `lib/auryn/v6/valuation-registry.ts`
- Test: `tests/auryn-v6-valuation-registry.test.mjs`

**Interfaces:**
- Consumes V4 classification + valuation factor.
- Produces method family, evidence state, decision-grade flag and required-input guidance.

- [ ] Write failing archetype tests for software, memory, AI-power, frontier, banks and REITs.
- [ ] Run RED.
- [ ] Implement registry without inventing missing financial inputs.
- [ ] Run GREEN.

### Task 4: Portfolio CIO overlay
**Files:**
- Create: `lib/auryn/v6/portfolio-cio.ts`
- Test: `tests/auryn-v6-portfolio-cio.test.mjs`

**Interfaces:**
- Consumes independent stock action + `PortfolioRisk` + optional current position weight/archetype exposure.
- Produces user-specific add/hold/reduce overlay and max new-position percentage.

- [ ] Write failing tests proving a standalone BUY can become BLOCK_ADD without changing the company call.
- [ ] Run RED.
- [ ] Implement concentration/correlation-aware overlay.
- [ ] Run GREEN.

### Task 5: V6 canonical analysis wrapper
**Files:**
- Create: `lib/auryn/v6/analyze.ts`
- Modify: `components/StockClient.tsx`
- Modify: `components/stock/v5/StockV5Decision.tsx`
- Test: `tests/auryn-v6-analysis-ui.test.mjs`

**Interfaces:**
- Wraps `CanonicalAnalysisSnapshot` from V5.1 with multi-timeframe, valuation method, optional model proof and portfolio overlay.

- [ ] Write failing tests for separate Evidence Confidence vs Model Proof and no probability wording.
- [ ] Run RED.
- [ ] Implement V6 wrapper and minimally surface proof/timeframe context for Pro/Extreme Pro.
- [ ] Run GREEN.

### Task 6: Model Health API and proof console
**Files:**
- Create: `app/api/model-health/route.ts`
- Modify: `app/calibration/page.tsx`
- Test: `tests/auryn-v6-model-health-api.test.mjs`
- Test: `tests/auryn-v6-model-health-ui.test.mjs`

**Interfaces:**
- API returns proof grade, horizon summaries, action ladder, promotion gate, exact-engine counts and weaknesses.

- [ ] Write failing API/UI contract tests.
- [ ] Run RED.
- [ ] Implement exact-engine outcome aggregation using Arena snapshots/outcomes.
- [ ] Update calibration page to show proof grade and promotion blockers before pooled history.
- [ ] Run GREEN.

### Task 7: Canonical V6 learning payload
**Files:**
- Modify: `components/StockClient.tsx`
- Modify: `app/api/validation/snapshot/route.ts`
- Test: `tests/auryn-v6-learning-payload.test.mjs`

**Interfaces:**
- Validation POST includes `v6` snapshot summary and stores it in immutable JSON evidence/source snapshot.

- [ ] Write failing test proving V6 snapshot ID/action/execution plan are persisted together.
- [ ] Run RED.
- [ ] Implement canonical V6 persistence while preserving backward-compatible legacy fields.
- [ ] Run GREEN.

### Task 8: V6 reliability matrix and release gate
**Files:**
- Create: `tests/auryn-v6-reliability.test.mjs`
- Modify: `package.json`
- Create: `AURYN_V6_RELEASE.md`
- Modify: `README.md`

**Interfaces:**
- Adds V6 focused test script and release documentation.

- [ ] Add deterministic proof/promotion/portfolio/timeframe invariants.
- [ ] Run V6 focused suite.
- [ ] Run full `npm test`.
- [ ] Run `npm run audit:v65`.
- [ ] Attempt `npm run build` and record environment limitation if `next` remains unavailable.
- [ ] Package clean source without `.env*` secrets, `.git`, `node_modules`, `.next`, `.engine-test`, caches or generated logs.
- [ ] Extract final ZIP and rerun full tests/audit from extracted package.
