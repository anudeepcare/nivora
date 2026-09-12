# AURYN V9.8 Three-Clock Valuation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add independent fundamental scenarios, thesis persistence and anti-anchoring diagnostics without changing AURYN's locked UX.

**Architecture:** Add focused V9.8 pure modules for the three clocks, thesis persistence and independent scenario valuation. Preserve V5 technical scenarios for tactical structure and expose a separate fundamental scenario object for CIO calibration/auditing.

**Tech Stack:** TypeScript, Node test runner, existing AURYN V9.7 engine.

**Spec:** `docs/superpowers/specs/2026-09-12-auryn-v980-three-clock-valuation.md`

## Global Constraints
- No UX/layout/style/component changes.
- No current-price-derived intrinsic value.
- Missing valuation inputs must remain unavailable.
- Deterministic output for identical inputs.
- Technical levels remain tactical.

### Task 1: Three-clock and thesis persistence core
**Files:** Create `lib/auryn/v98/three-clock.ts`; test `tests/auryn-v980-three-clock.test.mjs`.
- [ ] Test that technical shocks do not change thesis score.
- [ ] Test that repeated fundamental deterioration reduces thesis persistence.
- [ ] Implement clock separation and half-life weighting.
- [ ] Verify deterministic output.

### Task 2: Independent fundamental scenarios
**Files:** Create `lib/auryn/v98/fundamental-scenarios.ts`; test `tests/auryn-v980-fundamental-scenarios.test.mjs`.
- [ ] Test that values are identical when market price changes.
- [ ] Test unavailable inputs produce no fabricated scenario.
- [ ] Implement Bear/Base/Bull from independent value assumptions.
- [ ] Calculate implied returns only after scenario values exist.

### Task 3: Anti-anchoring audit
**Files:** Create `lib/auryn/v98/valuation-audit.ts`; test `tests/auryn-v980-valuation-audit.test.mjs`.
- [ ] Test ±2/±5/±10 distributions.
- [ ] Test suspicious clustering flag.
- [ ] Implement deterministic report.

### Task 4: CIO integration
**Files:** Modify `lib/auryn/v97/cio-engine.ts`; test `tests/auryn-v980-cio-integration.test.mjs`.
- [ ] Add optional independent valuation-clock input.
- [ ] Ensure technical changes affect deployment but not intrinsic scenario values.
- [ ] Ensure deterioration affects thesis/valuation confidence.
- [ ] Preserve V9.7 compatibility when V9.8 valuation is unavailable.

### Task 5: Release gate
**Files:** Modify `tsconfig.engine.json`, `package.json`; create release/verification docs.
- [ ] Run V9.8 tests.
- [ ] Run V9.7 regression gate.
- [ ] Run historical repository suite and compare baseline.
- [ ] Package without build artifacts/dependencies.
