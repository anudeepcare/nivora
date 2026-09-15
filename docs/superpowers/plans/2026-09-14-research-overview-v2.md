# AURYN Research Overview V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy Overview composition with the approved four-layer decision-first V2 while strengthening truthful fundamental valuation states.
**Architecture:** Add a dedicated Overview V2 component consuming canonical InstitutionalDecision, Market Truth, V5 chart/levels, and the shadow fundamental analyst contract. StockClient remains the integration boundary; deeper tabs remain untouched.
**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner.
**Spec:** `docs/superpowers/specs/2026-09-14-research-overview-v2-design.md`

## Global Constraints
- No CIO threshold/formula changes.
- No Market Truth/session changes.
- No portfolio or autonomous workflow changes.
- Missing fair value cannot become zero or -100% margin of safety.
- Technical levels never become fundamental fair value.

### Task 1: Fundamental invariants
- [ ] Add failing tests for null fair-value/margin/score propagation and valuation method state.
- [ ] Implement invariant-safe analyst contract.
- [ ] Run focused tests.

### Task 2: Dedicated Overview V2
- [ ] Add failing structural tests for hero, three clocks, two visual cards and four synthesis cards.
- [ ] Create `components/premium/AurynResearchOverviewV2.tsx`.
- [ ] Integrate existing canonical chart/decision inputs without duplicating decision logic.
- [ ] Run focused tests.

### Task 3: Literal responsive visual system
- [ ] Add V2 CSS with desktop 3-column hero, 3 clocks, 2 visuals, 4 synthesis cards.
- [ ] Add tablet/mobile collapse order from the spec.
- [ ] Remove the legacy Overview component from StockClient rendering while leaving deeper tabs intact.
- [ ] Run structural tests.

### Task 4: Release gates
- [ ] Run V2 tests.
- [ ] Run V9.9.9.10/V9.9.9.9 and Market Truth regressions.
- [ ] Verify autonomous workflow contracts.
- [ ] Package release ZIP.
