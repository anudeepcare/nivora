# AURYN V9 Research Lab & Feature Tournament Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic feature-research plane that generates 20k+ candidate hypotheses, evaluates historical observations with OOS/robustness/FDR gates, and keeps unproven features out of the production CIO.

**Architecture:** Add `lib/auryn/v9/*` as an isolated research subsystem on top of V8.4. Existing production decision/execution code is unchanged; V9 outputs research summaries and a versioned promotion allowlist only.

**Tech Stack:** TypeScript, Node test runner, existing AURYN statistics/backtest utilities, Next.js API/page surfaces.

**Spec:** `docs/superpowers/specs/2026-09-08-auryn-v9-research-lab-design.md`

## Global Constraints
- V8.4 Market Truth and broker gates remain unchanged.
- No automatic live-weight mutation.
- OOS evidence required for promotion.
- Transaction costs included before promotion metrics.
- Multiple-testing control required for tournament promotion.
- Missing evidence never becomes a neutral/zero observation.
- Research UI must distinguish tested evidence from untested catalog breadth.

---

### Task 1: V9 domain and feature catalog
**Files:** Create `lib/auryn/v9/domain.ts`, `feature-registry.ts`, `version.ts`; modify `tsconfig.engine.json`; test `tests/auryn-v9-feature-catalog.test.mjs`.
**Produces:** `generateFeatureCatalog()`, `FEATURE_FAMILIES`, V9 types/version.
- [ ] Write failing tests requiring >=20,000 deterministic unique candidates and broad feature-family coverage.
- [ ] Run focused test and verify failure.
- [ ] Implement catalog generator with base metrics, transforms, horizons and context interactions.
- [ ] Run focused test and verify pass.

### Task 2: Evaluation and robustness
**Files:** Create `lib/auryn/v9/evaluation.ts`, `statistics.ts`; test `tests/auryn-v9-evaluation.test.mjs`.
**Produces:** `evaluateFeature`, `benjaminiHochberg`, chronological OOS metrics.
- [ ] Write failing tests for cost-adjusted alpha, OOS split, IC, confidence bounds and FDR.
- [ ] Verify red.
- [ ] Implement deterministic evaluation/statistics.
- [ ] Verify green.

### Task 3: Feature Tournament and promotion policy
**Files:** Create `lib/auryn/v9/tournament.ts`, `promotion.ts`; test `tests/auryn-v9-tournament.test.mjs`.
**Produces:** `runFeatureTournament`, `assessFeaturePromotion`.
- [ ] Write failing tests proving in-sample-only winners are rejected and robust OOS winners survive.
- [ ] Verify red.
- [ ] Implement ranking, regime/archetype breadth, FDR and promotion gates.
- [ ] Verify green.

### Task 4: Production allowlist boundary
**Files:** Create `lib/auryn/v9/production-registry.ts`; test `tests/auryn-v9-production-boundary.test.mjs`.
**Produces:** immutable/versioned allowlist helpers.
- [ ] Write failing tests proving untested/unpromoted features cannot enter the production set.
- [ ] Verify red.
- [ ] Implement explicit promotion registry boundary.
- [ ] Verify green.

### Task 5: CLI and product surfaces
**Files:** Create `scripts/run_v9_feature_tournament.mjs`, `app/api/research-lab/route.ts`, `app/research-lab/page.tsx`; modify `package.json`; test `tests/auryn-v9-surface-contract.test.mjs`.
**Produces:** `npm run research:v9`, API/page.
- [ ] Write failing surface/CLI contract tests.
- [ ] Verify red.
- [ ] Implement CLI, API summary and research-lab page.
- [ ] Verify green.

### Task 6: Reliability and release
**Files:** Create `tests/auryn-v9-reliability.test.mjs`, `AURYN_V9_RELEASE.md`; modify README and engine test list.
- [ ] Add deterministic-repeatability, no-leakage and no-auto-promotion tests.
- [ ] Run V9 focused suite.
- [ ] Run complete legacy+V9 regression suite.
- [ ] Run V8 reality audit and V65 production audit.
- [ ] Package source without secrets/caches and rerun tests from extracted ZIP.
