# AURYN V9.3.6 Premium Product + Opportunity Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium mobile-first AURYN product layer and deterministic opportunity/scenario derivation on top of the V9.3.5 canonical snapshot without adding new data-fetch paths.

**Architecture:** V9.3.5 remains the only canonical data authority. V9.3.6 adds pure derived opportunity/scenario calculations plus reusable premium presentation components consumed by Research and styled consistently across Portfolio, Monitor, Trading Lab, and mobile.

**Tech Stack:** Next.js, React, TypeScript, existing Lucide icons, existing PriceChart, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-10-v936-premium-product-opportunity-design.md`

## Global Constraints
- No new provider fetches in V9.3.6 UI.
- Missing data is unavailable/neutral, never bearish zero.
- Bull/Base/Bear is scenario balance, not calibrated probability.
- V9.3.5 Market Truth and canonical snapshot remain authoritative.
- 375px mobile must not overflow horizontally.
- No Astra/OpenAI runtime dependency.

---

### Task 1: Opportunity and scenario engine
**Files:**
- Create: `lib/auryn/v936/opportunity.ts`
- Create: `lib/auryn/v936/domain.ts`
- Test: `tests/auryn-v936-opportunity.test.mjs`

**Interfaces:**
- Consumes: numeric evidence scores and action/setup context already calculated by AURYN.
- Produces: `buildOpportunityLens(input): OpportunityLens`.

- [ ] Write failing deterministic/missing-data/scenario-sum tests.
- [ ] Run focused test and verify RED.
- [ ] Implement pure available-weight normalization and scenario balance.
- [ ] Run focused test and verify GREEN.

### Task 2: Premium research overview
**Files:**
- Create: `components/premium/AurynDecisionHero.tsx`
- Create: `components/premium/AurynMetricGrid.tsx`
- Create: `components/premium/AurynScenarioBalance.tsx`
- Create: `components/premium/AurynSetupExplainer.tsx`
- Create: `components/premium/AurynResearchOverview.tsx`
- Modify: `components/StockClient.tsx`
- Test: `tests/auryn-v936-research-ui.test.mjs`

**Interfaces:**
- Consumes: canonical market truth, institutional decision, market intelligence/action map, existing candles/chart, opportunity lens.
- Produces: one responsive first-screen research overview.

- [ ] Write failing source/UX contract tests.
- [ ] Verify RED.
- [ ] Implement reusable overview components.
- [ ] Replace legacy first-screen composition in StockClient while preserving research tabs.
- [ ] Verify GREEN.

### Task 3: Premium global design system and mobile shell
**Files:**
- Create: `app/auryn-premium.css`
- Modify: `app/layout.tsx`
- Modify: `components/AppShell.tsx`
- Test: `tests/auryn-v936-mobile-shell.test.mjs`

**Interfaces:**
- Produces shared premium tokens/layout classes and mobile bottom navigation behavior.

- [ ] Write failing mobile/global shell contract.
- [ ] Verify RED.
- [ ] Implement responsive premium shell and CSS.
- [ ] Verify GREEN.

### Task 4: Portfolio, Monitor, Trading Lab visual unification
**Files:**
- Modify: `app/portfolio/page.tsx`
- Modify: `app/alerts/page.tsx` or canonical monitor surface used by AppShell
- Modify: `app/trading-lab/page.tsx`
- Modify: `app/auryn-premium.css`
- Test: `tests/auryn-v936-cross-product-ui.test.mjs`

**Interfaces:**
- Consumes existing canonical APIs only.
- Produces consistent page headers, summary surfaces, canonical action/setup/price language.

- [ ] Write failing cross-product contract.
- [ ] Verify RED.
- [ ] Apply shared premium page hierarchy without changing business logic.
- [ ] Verify GREEN.

### Task 5: Release integration
**Files:**
- Modify: `package.json`
- Create: `AURYN_V9_3_6_RELEASE.md`
- Create: `scripts/run_v936_release_gate.mjs`
- Test: `tests/auryn-v936-release.test.mjs`

**Interfaces:**
- Produces `test:v936` and `gate:v936`.

- [ ] Add focused suite to package scripts and release gate.
- [ ] Run V9.3.6 focused suite.
- [ ] Run full regression and preserved V9.3.5 safety gates.
- [ ] Package exact ZIP excluding secrets/caches/build artifacts.
- [ ] Re-extract ZIP and rerun focused + full regression.
