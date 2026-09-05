# NIVORA V65.25 Responsive System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild NIVORA's responsive presentation so desktop and mobile both feel premium and cannot regress each other.

**Architecture:** Keep existing product/data components and introduce one authoritative responsive layer with shared design tokens plus explicitly separated desktop and mobile component treatments. Update AppShell geometry where CSS alone is fragile, but preserve all scoring/data interfaces.

**Tech Stack:** Next.js, React, TypeScript, CSS

**Spec:** `docs/superpowers/specs/2026-09-04-v65-25-responsive-system.md`

## Global Constraints
- Desktop acceptance: >=1024px.
- Mobile acceptance: <=720px, primary reference 390px.
- Preserve scoring, quote integrity, portfolio math and Trading Lab safety.
- No new dependency or Supabase migration.

### Task 1: Shell and responsive tokens
- [ ] Write failing desktop/mobile shell tests.
- [ ] Implement shared tokens, desktop header grid and centered nav.
- [ ] Keep mobile dock independent and fixed.
- [ ] Run tests.

### Task 2: Analyze responsive composition
- [ ] Write failing desktop/mobile Analyze hierarchy tests.
- [ ] Implement desktop metric strip/decision spacing and mobile readability rules.
- [ ] Preserve info affordance and data semantics.
- [ ] Run tests.

### Task 3: Portfolio desktop + mobile dual presentation
- [ ] Write failing tests for desktop investment rows and mobile editorial cards.
- [ ] Implement desktop row geometry, decision placement and action overflow.
- [ ] Preserve mobile V65.23 hierarchy.
- [ ] Run tests.

### Task 4: Shared visual language across Trading Lab / Alerts / Visual Intelligence
- [ ] Write failing shared-surface tests.
- [ ] Apply typography/card/control system.
- [ ] Keep sparse-history chart fallback compact and useful.
- [ ] Run tests.

### Task 5: Verification and packaging
- [ ] Run V65.25 regressions plus recent V65.19-V65.24 regressions.
- [ ] Run engine TypeScript compile.
- [ ] Package source excluding dependencies/build caches/secrets.
