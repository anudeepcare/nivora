# Portfolio + Decision Visual Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make portfolio navigation/visuals readable and make Decision Map/Scenario Spectrum positions truthfully data-driven.
**Architecture:** Keep canonical CIO/Market Truth untouched. Add small pure visual-position helpers and consume existing canonical values/actions in UI components; CSS provides hierarchy only.
**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner.
**Spec:** `docs/superpowers/specs/2026-09-14-portfolio-decision-visual-integrity-design.md`

## Global Constraints
- No ticker-specific fixes.
- Do not change CIO formulas or Market Truth/session architecture.
- Do not fabricate values or artificially spread scenario points.
- Preserve autonomous workflow files and canonical secrets.

---

### Task 1: Truthful decision visual geometry
**Files:** Modify `components/premium/AurynResearchOverview.tsx`; modify CSS; test `tests/auryn-v9997-visual-integrity.test.mjs`.
- [ ] Write failing source-contract tests for dynamic price normalization, no hard-coded ACCUMULATION, and actual scenario positions.
- [ ] Run test and verify failure.
- [ ] Implement pure normalized price positioning and semantic structural zone copy.
- [ ] Strengthen rails/nodes/current marker in CSS.
- [ ] Run test and verify pass.

### Task 2: Portfolio navigation and matrix readability
**Files:** Modify `app/portfolio/page.tsx`, `components/portfolio/PortfolioPulse.tsx`, CSS; test same file.
- [ ] Write failing tests for scroll-spy hooks and matrix weight/return/value geometry with collision handling.
- [ ] Run test and verify failure.
- [ ] Implement sticky scroll-spy nav and section IDs.
- [ ] Implement matrix geometry/collision labels without changing portfolio calculations.
- [ ] Strengthen performance line hierarchy.
- [ ] Run test and verify pass.

### Task 3: Release verification
**Files:** `package.json`, workflow files unchanged.
- [ ] Run new tests.
- [ ] Run `npm run test:v9996`.
- [ ] Run production build.
- [ ] Verify autonomous workflow files and canonical secret names remain present.
- [ ] Package release ZIP.
