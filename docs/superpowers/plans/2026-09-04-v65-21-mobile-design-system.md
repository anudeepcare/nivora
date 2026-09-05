# V65.21 Mobile Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate NIVORA mobile presentation into one coherent system.
**Architecture:** CSS mobile tokens/primitives override legacy drift; shared info glyph remains geometric; existing page DOM/data logic is preserved.
**Tech Stack:** Next.js, React, TypeScript, CSS
**Spec:** docs/superpowers/specs/2026-09-04-v65-21-mobile-design-system.md

## Global Constraints
- Mobile target: <=720px, primary acceptance at 390px.
- Preserve desktop behavior and all decision/data/trading semantics.
- No new dependency.

## Tasks
- [ ] Add regression tests for shared type/spacing/nav/tab/chart/portfolio-card contracts; run RED.
- [ ] Add V65.21 mobile tokens and shared component rules; run GREEN.
- [ ] Add compact sparse-chart and portfolio holding rules; run GREEN.
- [ ] Run prior mobile regressions and TypeScript engine compile.
- [ ] Package release without secrets/build caches.
