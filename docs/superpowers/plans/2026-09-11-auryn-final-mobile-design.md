# AURYN Final Mobile UX Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate mobile/PWA UX into one final layer and materially redesign the mobile stock first viewport.

**Architecture:** One final mobile stylesheet, separate mobile/desktop stock masthead markup, preserved PWA fixed-header shell, and explicit desktop decision footer alignment.

**Tech Stack:** Next.js, React, TypeScript, CSS, iOS PWA metadata.

**Spec:** `docs/superpowers/specs/2026-09-11-auryn-final-mobile-design.md`

## Global Constraints
- Mobile contracts: 390px, 393px, 430px.
- No horizontal overflow.
- iOS status bar remains opaque black.
- Header owns top safe area once; bottom nav owns bottom safe area once.
- No engine/data changes.

### Task 1: Consolidate mobile stylesheet
- [ ] Add failing import/cascade tests.
- [ ] Remove versioned mobile stylesheet imports.
- [ ] Rewrite authoritative `auryn-mobile.css`.
- [ ] Run tests.

### Task 2: Mobile stock masthead component
- [ ] Add failing markup tests.
- [ ] Render separate mobile and desktop mastheads.
- [ ] Style compact identity/price/facts composition.
- [ ] Run tests.

### Task 3: Desktop decision footer
- [ ] Add failing alignment tests.
- [ ] Wrap note/actions/market-levels in explicit footer.
- [ ] Add compact desktop grid.
- [ ] Run tests.

### Task 4: Cross-route mobile regression
- [ ] Validate auth/research/stock/technicals/portfolio/monitor/trading/profile CSS contracts.
- [ ] Run prior V9.4.x regression gates.
- [ ] Package ZIP.
