# AURYN V8 Reality Audit & CIO Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and pass a 100-ticker real-stock audit while fixing classification, lifecycle, and CIO consistency defects exposed by HIMS/ASTS-style cases.

**Architecture:** Extend the existing V7 canonical chain rather than replacing it. Classification becomes evidence-aware with DIGITAL_HEALTH_PLATFORM and UNKNOWN lifecycle; CIO gains explicit horizon-consensus arbitration; V8 Reality Audit becomes a release gate and report generator.

**Tech Stack:** TypeScript, Node test runner, existing AURYN V4-V7 engine modules, Next.js source contracts.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v8-reality-audit-cio-consistency-design.md`

## Global Constraints
- No ticker-specific production hardcoding.
- Missing data is never converted to bearish zero.
- Missing lifecycle evidence returns UNKNOWN rather than MATURITY.
- Missing valuation may cap bullishness but cannot suppress justified bearish risk reduction.
- Existing V7 Market Truth and Canonical Trust Audit remain fail-closed.
- Mobile behavior and existing responsive shell are preserved.
- Live provider audit requires runtime credentials and is never simulated as passed offline.

---

### Task 1: Classification and lifecycle hardening
**Files:**
- Modify: `lib/auryn/v4/domain.ts`
- Modify: `lib/auryn/v4/classification.ts`
- Modify: `lib/auryn/v4/model-registry.ts`
- Modify: `lib/auryn/v6/valuation-registry.ts`
- Test: `tests/auryn-v8-classification-lifecycle.test.mjs`

**Interfaces:**
- Produces `BusinessModel = DIGITAL_HEALTH_PLATFORM`.
- Produces `LifecycleStage = UNKNOWN`.
- `classifyV4Security(input)` returns specific evidence-aware classifications without ticker checks.

- [ ] Write failing tests for HIMS-style digital health, ASTS-style missing-growth lifecycle, and data-center REIT precedence.
- [ ] Run focused test and confirm failures are caused by current BIOTECH/MATURITY/data-center precedence behavior.
- [ ] Implement evidence-aware precedence, new business model, and UNKNOWN lifecycle.
- [ ] Run focused tests to green.

### Task 2: CIO horizon-consistency arbitration
**Files:**
- Modify: `lib/auryn/v5/cio.ts`
- Test: `tests/auryn-v8-cio-consistency.test.mjs`

**Interfaces:**
- `resolveV5CioDecision` keeps its public signature.
- Primary action may be REDUCE when the horizon ladder is broadly bearish despite unavailable valuation.
- Owner action cannot remain HOLD when weak thesis plus broad bearish horizon consensus requires risk reduction.

- [ ] Write failing ASTS-style test with NOW REDUCE, SWING SELL, 6-12M REDUCE, 3-5Y REDUCE and assert primary/owner REDUCE.
- [ ] Add a HIMS-style test proving long-term HOLD can coexist with NOW/SWING REDUCE without forcing primary REDUCE when long horizons remain HOLD and thesis is healthy enough.
- [ ] Implement deterministic horizon arbitration.
- [ ] Run focused tests to green.

### Task 3: 100-ticker golden universe and Reality Audit
**Files:**
- Create: `lib/auryn/v8/reality-audit.ts`
- Create: `lib/auryn/v8/version.ts`
- Create: `tests/auryn-v8-100-ticker-reality-audit.test.mjs`
- Modify: `tsconfig.engine.json`
- Modify: `package.json`

**Interfaces:**
- `V8_GOLDEN_UNIVERSE` contains exactly 100 fixtures.
- `runV8RealityAudit()` returns `{total, passed, violations, rows}`.
- Each row reports symbol, expected/actual business model, lifecycle, analyst model, valuation method, and violations.

- [ ] Write failing test requiring 100 entries and zero critical violations.
- [ ] Implement the golden universe and audit runner using production classifier/model/valuation code.
- [ ] Fix systemic classifier/model defects revealed by the audit, never ticker-hardcode production behavior.
- [ ] Add `npm run audit:v8-reality` script.
- [ ] Run the audit to zero critical violations.

### Task 4: Strength-vs-direction presentation contract
**Files:**
- Modify: `components/stock/StockThesisPanel.tsx`
- Modify: `components/stock/StockDecisionSummary.tsx`
- Test: `tests/auryn-v8-presentation-semantics.test.mjs`

**Interfaces:**
- Thesis and moat cards display strength labels independently from trend/direction labels.
- No user-facing string can render `36/100 · STABLE` as if STABLE were the score quality.

- [ ] Write failing source-contract tests for separate `Thesis Strength`/`Thesis Trend` and `Moat Strength`/`Moat Trend` semantics.
- [ ] Implement the minimum presentation change while preserving mobile layout.
- [ ] Run focused UI contract tests to green.

### Task 5: Live 100-ticker audit runner contract
**Files:**
- Create: `scripts/run_v8_live_100_audit.mjs`
- Create: `docs/V8_LIVE_100_AUDIT.md`
- Test: `tests/auryn-v8-live-audit-contract.test.mjs`

**Interfaces:**
- Script requires `AURYN_BASE_URL` and optional bearer/audit token.
- It queries the deployed analysis endpoint sequentially with bounded concurrency, records price-state/classification/lifecycle/action/trust/plan consistency, and exits nonzero on critical invariants.
- It does not embed credentials or claim live success without running against a deployment.

- [ ] Write source-contract test for environment-driven runner and fail-closed exit behavior.
- [ ] Implement runner and instructions.
- [ ] Run contract test.

### Task 6: Release verification and package
**Files:**
- Create: `AURYN_V8_RELEASE.md`
- Create: `AURYN_V8_VERIFICATION.txt`
- Modify: `README.md`

**Interfaces:**
- Release record includes exact test count, 100-ticker audit result, build status, production audit status, and live-audit limitation.

- [ ] Run `npm test` and record exact pass/fail count.
- [ ] Run `npm run audit:v8-reality` and require 100/100 with zero critical violations.
- [ ] Run `npm run audit:v65`.
- [ ] Attempt `npm run build`; record environment result exactly.
- [ ] Create clean ZIP excluding `.env*` except `.env.example`, `.git`, `node_modules`, `.next`, `.engine-test`, and build caches.
- [ ] Extract exact ZIP into a fresh directory and rerun `npm test`, `npm run audit:v8-reality`, and `npm run audit:v65`.
