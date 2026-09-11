# AURYN V9.3.4.3 Decision Policy De-Bias + Expert UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make V9.3.4 the evidence-driven decision authority, eliminate legacy HOLD→WAIT bias, and deliver one first-screen expert action map with setup explanations and no hidden essential information.

**Architecture:** Extend the V9.3.1 institutional kernel into a V9.3.4.3 policy contract that consumes V9.3.4 technical evidence and treats V5 only as a severe challenger. Keep pricing/history reliability unchanged. Update the stock hero to render setup semantics, action levels, five decision metrics, and specific reasoning in one compact flow.

**Tech Stack:** Next.js, React, TypeScript ES2017 target, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-10-v9343-debias-expert-ux-design.md`

## Global Constraints
- No forced BUY percentage or action quota.
- Missing data lowers evidence coverage; it does not become bearish zero.
- V5 HOLD cannot force WAIT.
- Setup state never directly equals investment action.
- Preserve Market Truth, historical fallback, V9.3.4 snapshot, and Trading Lab fail-closed behavior.
- No paid AI dependency.

---

### Task 1: Decision policy de-bias

**Files:**
- Modify: `lib/auryn/v931/domain.ts`
- Modify: `lib/auryn/v931/decision-kernel.ts`
- Create: `tests/auryn-v9343-debias-policy.test.mjs`

**Interfaces:**
- Consumes: V9.3.4 market-structure score and existing pillar scores/evidence.
- Produces: STRONG_BUY/BUY/START_SMALL/WAIT/AVOID new-money actions and ADD/HOLD/WATCH/REDUCE/EXIT owner actions.

- [ ] Write failing tests proving V5 HOLD cannot override a positive V9.3.4 policy, missing valuation does not become bearish, hard SELL/structural-break veto still works, and every action is reachable.
- [ ] Run the new test and verify RED.
- [ ] Extend domain action unions and implement the minimal evidence-driven policy with renormalized available-pillar weights and explicit hard-veto reasons.
- [ ] Run the test and verify GREEN.

### Task 2: Decision explanation and setup semantics

**Files:**
- Create: `lib/auryn/v934/setup-explanations.ts`
- Modify: `lib/auryn/v931/decision-kernel.ts`
- Create: `tests/auryn-v9343-setup-explanations.test.mjs`

**Interfaces:**
- Consumes: SetupState, action map, new-money action.
- Produces: meaning, action implication, confirmation, invalidation, and setup-is-not-action disclaimer.

- [ ] Write failing tests for BREAKOUT_READY, DOUBLE_BOTTOM-compatible reversal state copy, TREND_BREAKDOWN/damaged state, and non-automatic BUY/SELL semantics.
- [ ] Run and verify RED.
- [ ] Implement deterministic explanation builders with no invented numbers.
- [ ] Run and verify GREEN.

### Task 3: First-screen expert UX

**Files:**
- Modify: `components/stock/v931/InstitutionalDecisionBrief.tsx`
- Modify: `components/market/MarketActionMap.tsx`
- Modify: `app/auryn-product.css`
- Create: `tests/auryn-v9343-first-screen-ux.test.mjs`

**Interfaces:**
- Consumes: InstitutionalDecision, V9.3.4 marketIntelligence, existing metric values.
- Produces: one compact decision surface with setup explanation, action levels, five decision metrics, and no essential expander.

- [ ] Write failing UI source-contract tests for setup semantics on first screen, context-aware entry labels, five metrics, always-visible levels, and absence of duplicate verdict/essential details expanders.
- [ ] Run and verify RED.
- [ ] Implement the compact UI and low-chrome CSS.
- [ ] Run and verify GREEN.

### Task 4: Distribution diagnostics

**Files:**
- Create: `scripts/audit_v9343_decision_distribution.mjs`
- Modify: `package.json`
- Extend: `tests/auryn-v9343-debias-policy.test.mjs`

**Interfaces:**
- Consumes: deterministic fixture matrix / optional supplied snapshot records.
- Produces: machine-readable action distribution and reason counts.

- [ ] Add failing tests for deterministic action distribution and legacy-veto reason absence.
- [ ] Run and verify RED.
- [ ] Implement the audit script and npm alias `audit:v9343-decisions`.
- [ ] Run and verify GREEN.

### Task 5: Compatibility and release gate

**Files:**
- Modify: `package.json`
- Create: `AURYN_V9_3_4_3_RELEASE.md`
- Create: `scripts/run_v9343_release_gate.mjs`

**Interfaces:**
- Consumes: V9.3.4.3 focused tests plus preserved V9.3.4/V9.3.1/V9.3/V9.2/V8/V65 gates.
- Produces: CODE_READY_LIVE_VALIDATION_REQUIRED unless live validation is explicitly supplied.

- [ ] Add V9.3.4.3 tests to the permanent regression command.
- [ ] Run focused tests, full regression, V8 Reality, V9.2, V9.3, V9.3.1 reliability, and V65.
- [ ] Package only after all local code gates pass.
