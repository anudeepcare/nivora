# AURYN Investment Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved four-lens long-term investment decision system and analyst explanation layer.

**Architecture:** Add a pure long-term roadmap engine over existing candles/fundamentals, then render it in the existing premium Overview. Preserve the current daily execution engine and price-state contracts.

**Tech Stack:** Next.js, React, TypeScript, existing AURYN canonical engines, Node tests.

**Spec:** `docs/superpowers/specs/2026-09-15-investment-roadmap-design.md`

## Global Constraints
- No fabricated fundamental fair value.
- Fib/wave output is evidence/context, not certainty.
- Existing Market Truth/execution truth remains authoritative.
- Mobile must not compress roadmap labels into overlaps.

---

## Task 1 — Long-term structure engine
- [ ] Write failing tests for weekly aggregation, WMA, swing anchors, Fib zones, consolidation and wave-candidate confidence.
- [ ] Implement pure engine.
- [ ] Run tests.

## Task 2 — Investment narrative
- [ ] Write failing tests for Why Own / Worth / Accumulate / Confirm / Break / Next Decision output.
- [ ] Implement deterministic narrative from canonical evidence.
- [ ] Run tests.

## Task 3 — Premium Overview UX
- [ ] Write failing structural UX tests for four pillars, roadmap, evidence cards and mobile ladder.
- [ ] Implement responsive components and styles.
- [ ] Run tests.

## Task 4 — Integration and release gate
- [ ] Wire engine through StockClient without altering V24.2 price truth.
- [ ] Run full prior regression chain.
- [ ] Add release verifier and deployment artifact.
