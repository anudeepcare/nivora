# NIVORA V65.18 WOW UX + Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make NIVORA feel premium and immediately useful on desktop/mobile while reducing avoidable UI/data overhead.

**Architecture:** Centralize final presentation rules in the shared CSS system and shared shell/navigation. Keep page-specific content logic intact. Improve performance through UI-cost reduction, stable memoized data transforms, and avoiding unnecessary fetch/re-render work in the stock/portfolio client paths.

**Tech Stack:** Next.js, React, TypeScript, CSS, Supabase, NIVORA V65 engine.

**Spec:** `docs/superpowers/specs/2026-09-04-v6518-wow-ux-performance-design.md`

## Global Constraints
- One visual system across Analyze / Portfolio / Trading Lab.
- True centered desktop navigation.
- Mobile first but desktop must look premium.
- Keep real circled-i SVG component.
- Preserve decision/scoring/trading safety semantics.
- Performance work must not reduce data integrity.

### Task 1: Shell/navigation geometry
Write regression test, then center desktop nav independent of logo/avatar widths and improve mobile glass nav/safe-area behavior.

### Task 2: Unified typography and density
Write regression test, then define consistent metric/section/body/button scale for all three core pages; remove conflicting final overrides.

### Task 3: First-impression Analyze composition
Write regression test, then tighten dead space, center content, improve header/search/quote/metric visual hierarchy and above-fold balance.

### Task 4: Portfolio visual consistency
Write regression test, then preserve all meaningful visual modes while applying the unified scale/glass system and avoiding dashboard-like overboxing.

### Task 5: Trading Lab visual consistency
Write regression test, then align title spacing/cards/nav typography with shared system and reduce dead vertical space.

### Task 6: Performance pass
Audit stock/portfolio client effects/fetches. Add source-contract tests for duplicate fetch prevention and stable memoized expensive transforms where appropriate. Reduce large blur/compositing costs and defer below-fold non-critical rendering without changing data truth.

### Task 7: Verification/release
Run focused regressions, engine test suite, TypeScript compile/build when dependencies permit, then package V65.18.
