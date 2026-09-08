# AURYN V7 Trust & Precision OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a production-source AURYN V7 release in which every price-sensitive research surface consumes one canonical Market Truth snapshot, CIO decision, ExecutionPlan and Setup Map, with full professional metrics and mobile-safe presentation.

**Architecture:** Keep V6 Proof OS intact. Add a V7 trust/presentation layer and tighten V5 scenario orchestration so Scenario Map is derived from the canonical ExecutionPlan. Centralize user-facing factor selection/formatting and reuse the same scenario component in summary and Technicals without duplicating calculations.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing AURYN V4/V5/V6 engines, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v7-trust-precision-os-design.md`

## Global Constraints

- Preserve V6 Market Truth, Model Proof, portfolio CIO and paper-execution gates.
- Do not enable autonomous live-money execution.
- Missing evidence must render N/A, never 0.
- Full professional metrics remain available in Extreme Pro.
- Mobile layout is a preserve-and-protect requirement.
- Scenario Map may not create an independent actionable plan.

---

### Task 1: Canonical Scenario Map Contract

**Files:**
- Modify: `lib/auryn/v5/domain.ts`
- Modify: `lib/auryn/v5/scenarios.ts`
- Modify: `lib/auryn/v5/analyze.ts`
- Test: `tests/auryn-v7-scenario-canonical.test.mjs`

**Interfaces:**
- Consumes: `ExecutionPlan`, `TechnicalSnapshot`, `PatternSignal[]`
- Produces: `ScenarioMap` with `snapshotId`, `intent`, canonical bull case, contextual base/bear cases

- [ ] Write tests proving scenario snapshot/trigger/zone/targets/invalidation match ExecutionPlan.
- [ ] Run focused test and verify it fails on V6 behavior.
- [ ] Reorder V5 analysis to build decision and execution plan before scenario map.
- [ ] Derive actionable bull-case levels from ExecutionPlan and block price levels when plan is BLOCKED.
- [ ] Run focused tests and commit-equivalent checkpoint.

### Task 2: Signature Setup Map Surface

**Files:**
- Modify: `components/stock/v5/ScenarioMapPanel.tsx`
- Modify: `components/StockClient.tsx`
- Modify: `app/auryn-product.css`
- Test: `tests/auryn-v7-setup-map-ui.test.mjs`

**Interfaces:**
- Consumes: canonical `ScenarioMap`, canonical `ExecutionPlan`
- Produces: one recognizable AURYN Setup Map surface, compact summary + full Technicals rendering

- [ ] Write UI contract tests for setup title, Bull/Base/Bear, canonical levels, AURYN signature mark and mobile stacking.
- [ ] Verify tests fail.
- [ ] Add compact summary-mode rendering after decision/execution plan and full Technicals rendering from the same object.
- [ ] Add mobile-first spacing and no-overflow CSS.
- [ ] Run focused tests.

### Task 3: Hero Evidence Hierarchy and Formatting

**Files:**
- Modify: `components/stock/v5/StockV5Decision.tsx`
- Modify: `lib/auryn/v5/format.ts`
- Modify: `app/auryn-product.css`
- Test: `tests/auryn-v7-hero-formatting.test.mjs`

**Interfaces:**
- Consumes: V5 metrics + V6 proof/weekly/valuation
- Produces: fixed six-factor hero ordering and globally safe professional display values

- [ ] Write tests for Thesis/Business/Technical/Entry/Valuation/Risk ordering and no RSI/Risk stacking collision.
- [ ] Verify tests fail.
- [ ] Implement explicit factor selection and state-aware styling.
- [ ] Show Model Proof/weekly/valuation-method only in Extreme Pro.
- [ ] Extend formatting contract tests for all metric units.
- [ ] Run focused tests.

### Task 4: Cross-Tab Canonical Invariants

**Files:**
- Modify: `components/StockClient.tsx`
- Modify: `components/stock/StockThesisPanel.tsx` if needed
- Test: `tests/auryn-v7-cross-tab-invariants.test.mjs`

**Interfaces:**
- Consumes: V5/V6 canonical objects
- Produces: synchronized labels/actions/levels across Thesis, Business, Earnings, Technicals, Ownership, Catalysts and Options

- [ ] Add tests proving no legacy directional call appears when V5/V6 exists.
- [ ] Add tests proving Technicals labels WATCH rather than DCA when intent != ACCUMULATE.
- [ ] Add tests proving Options uses canonical action and Market Truth.
- [ ] Make minimal code changes required for the contracts.
- [ ] Run focused tests.

### Task 5: Mobile Trust/Precision Acceptance

**Files:**
- Modify: `app/auryn-product.css`
- Test: `tests/auryn-v7-mobile-trust-ui.test.mjs`

**Interfaces:**
- Produces: mobile-safe hero, setup map, plan and metric explorer at 390/430/620 breakpoints

- [ ] Add CSS contract tests for single-column hero, 2-column factor grid, stacked scenario cards and no fixed oversized widths.
- [ ] Verify tests fail where applicable.
- [ ] Apply only targeted responsive changes; preserve existing successful phone UX.
- [ ] Run focused tests.

### Task 6: V7 Release and Full Verification

**Files:**
- Create: `lib/auryn/v7/version.ts`
- Create: `AURYN_V7_RELEASE.md`
- Modify: `components/stock/v5/StockV5Decision.tsx`
- Modify: `README.md`
- Modify: `package.json`
- Test: `tests/auryn-v7-release.test.mjs`

**Interfaces:**
- Produces: `auryn-v7-trust-precision-1` release surface and package scripts

- [ ] Add release/version contract test.
- [ ] Add V7 version and release documentation.
- [ ] Run V7 focused tests.
- [ ] Run full `npm test`.
- [ ] Run `npm run audit:v65`.
- [ ] Attempt `npm run build`; document environment failure if Next dependencies are unavailable.
- [ ] Create clean ZIP excluding secrets, `.git`, `.next`, `node_modules`, `.engine-test` and caches.
- [ ] Extract final ZIP and rerun full tests + audit from exact package bytes.
