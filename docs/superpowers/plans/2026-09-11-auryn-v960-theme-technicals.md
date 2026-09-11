# AURYN V9.6 Theme + Technicals Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one deterministic semantic theme system plus a premium Technicals presentation with full-app readability.

**Architecture:** Replace the accumulated theme stylesheet with a single token/surface contract. Keep all data/decision markup intact and restyle the existing Technicals semantic groups into Market State, Verdict, Factors and Indicator Board.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-11-auryn-v960-theme-technicals.md`

## Global Constraints
- Do not change engine, Market Truth, provider, chart-level, portfolio-calculation, or canonical-decision logic.
- Keep approved Research hero/chart geometry.
- Theme names: Classic, Noir, Sapphire, Racing Green, Bordeaux, Arctic, Bronze.
- Theme and appearance persistence remain localStorage-backed and pre-paint restored.

---

### Task 1: Theme contract regression gate
**Files:** Create `tests/auryn-v960-theme-technicals.test.mjs`
- [ ] Add assertions for seven themes, semantic paired surfaces, footer, stock tabs, Technicals, and Large text.
- [ ] Run test and verify it fails against V9.5.8.
- [ ] Commit with implementation in Task 2.

### Task 2: Replace accumulated theme paint
**Files:** Replace `app/auryn-themes.css`
- [ ] Define complete tokens for seven editions.
- [ ] Map global chrome, tabs, cards, footer, forms, portfolio, evidence surfaces, charts and auth to semantic tokens.
- [ ] Make dark-named editions use readable tinted editorial canvases instead of dark page backgrounds that expose legacy hard-coded text.
- [ ] Run V9.6 and prior V9.5.x theme/search tests.

### Task 3: Technicals visual consolidation
**Files:** Modify `app/auryn-themes.css`; no decision/data markup changes in `components/StockClient.tsx`
- [ ] Restyle Market State as a clean strip.
- [ ] Restyle Technical Verdict as a single raised reading card.
- [ ] Restyle factor grid as six equal cards.
- [ ] Restyle indicators as a responsive 4/2/1-column board.
- [ ] Remove giant gray wrapper/dark alternating cells through explicit V9.6 ownership.
- [ ] Run regression tests.

### Task 4: Readability + footer
**Files:** Modify `app/auryn-themes.css`
- [ ] Give ProductFooter explicit surface/foreground ownership.
- [ ] Make Large text visibly scale supporting copy, labels, navigation and metrics.
- [ ] Add mobile rules preserving iOS/PWA geometry.
- [ ] Run regression tests.

### Task 5: Release verification
**Files:** Create `AURYN_V9_6_RELEASE.md`, `AURYN_V9_6_VERIFICATION.txt`
- [ ] Run V9.6 regression test.
- [ ] Run V9.5.1–V9.5.8 regression tests.
- [ ] Run TypeScript compile/build when dependencies are available.
- [ ] Package the verified source ZIP.
