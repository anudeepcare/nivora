# AURYN V9.7 CIO Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the V9.7 two-speed CIO decision engine with stable compounder quality, persistent deterioration logic, differentiated capital deployment and deterministic calibration diagnostics.

**Architecture:** Add a focused `lib/auryn/v97` engine that consumes the existing canonical six-pillar evidence and technical state, computes slow-brain quality, deterioration, deployment quality, agreement/confidence and policy actions, then use it inside the existing V9.3.1 decision kernel without changing the public decision shape.

**Tech Stack:** TypeScript, Node test runner, existing AURYN decision/domain types.

**Spec:** `docs/superpowers/specs/2026-09-12-auryn-v970-cio-engine.md`

## Global Constraints
- UX is locked; no CSS/TSX/layout changes.
- Market Truth authority remains unchanged.
- Missing evidence is uncertainty, not bearishness.
- No forced action-distribution quotas.
- Existing `InstitutionalDecision` shape remains compatible.
- Deterministic output for identical inputs.

---

### Task 1: V9.7 CIO core
**Files:**
- Create: `lib/auryn/v97/cio-engine.ts`
- Create: `lib/auryn/v97/domain.ts`
- Test: `tests/auryn-v970-cio-engine.test.mjs`

**Interfaces:**
- Consumes existing six pillar scores, evidence completeness and technical state.
- Produces `AurynCioAssessment` with compounderQuality, deterioration, deploymentQuality, agreement, confidence and action recommendations.

- [ ] Write failing tests for thesis stability, deterioration corroboration, high-quality/mixed-timing separation and deterministic output.
- [ ] Run tests and confirm red.
- [ ] Implement pure formulas with no side effects.
- [ ] Run tests and confirm green.

### Task 2: Decision-kernel integration
**Files:**
- Modify: `lib/auryn/v931/decision-kernel.ts`
- Test: `tests/auryn-v970-decision-integration.test.mjs`

**Interfaces:**
- Calls `buildAurynCioAssessment`.
- Keeps `InstitutionalDecision` output shape unchanged.
- Uses CIO assessment for new-money, owner and long-term actions while preserving hard vetoes.

- [ ] Write failing integration tests for ATTRACTIVE+WAIT, ATTRACTIVE+START_SMALL, deterioration→REDUCE/AVOID, and no technical veto of long-term quality.
- [ ] Run red.
- [ ] Integrate V9.7 assessment.
- [ ] Run green and existing decision-policy regressions.

### Task 3: Opportunity/scenario diagnostics
**Files:**
- Modify: `lib/auryn/v936/opportunity.ts`
- Modify: `lib/auryn-decision-audit.ts`
- Test: `tests/auryn-v970-calibration.test.mjs`

**Interfaces:**
- Opportunity remains 0–100 but weights slow quality separately from deployment.
- Audit adds high-quality WAIT and deterioration diagnostics without changing API compatibility.

- [ ] Write failing calibration tests.
- [ ] Implement diagnostics and bounded opportunity weighting.
- [ ] Verify green.

### Task 4: Release gate
**Files:**
- Create: `AURYN_V9_7_RELEASE.md`
- Create: `AURYN_V9_7_VERIFICATION.txt`

- [ ] Run V9.7 tests.
- [ ] Run V9.6.3 decision audit and existing canonical-decision regressions.
- [ ] Run TypeScript/build when dependencies permit.
- [ ] Package source ZIP with no node_modules/.next.
