# AURYN One Decision + Horizon-Aware Research Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Research Overview present one canonical AURYN decision, compact adaptive valuation, and horizon-aware long-term structure without contradictory or duplicate recommendations.

**Architecture:** Keep the canonical AURYN decision as the only recommendation source. CIO becomes explanation/sizing logic embedded inside the existing AURYN Call rather than a second hero. Long-term structure remains independent evidence but labels levels by horizon and current-price relationship; valuation adapts between partial evidence and decision-grade fair value.

**Tech Stack:** Next.js, React, TypeScript, existing AURYN canonical engines and CSS.

**Spec:** Approved in chat on 2026-09-15 from OSCR/ZETA/GOOGL/QXO acceptance screenshots.

## Global Constraints
- One canonical brain and one visible AURYN Call.
- Do not manufacture missing valuation evidence or convert missing data to bearish zero.
- Daily setup invalidation, weekly structural failure, and business-thesis deterioration are separate concepts.
- Deep-cycle levels must never be presented as today's buy zone.
- Long-term structure score is explicitly a weekly price-structure score, not an investment rating.
- Preserve V24.2 live-price truth and all later canonical/regime safeguards.

---

### Task 1: Merge CIO into AURYN Call
- [ ] Write failing contract tests for one visible decision hero and canonical actions.
- [ ] Move confidence, position sizing, entry/confirm/setup invalidation, Why, and What Changes It into AURYN Call.
- [ ] Remove standalone CIO hero while preserving the CIO modal.
- [ ] Run tests.

### Task 2: Make valuation adaptive and compact
- [ ] Write failing tests for partial and decision-grade valuation states.
- [ ] Replace large partial placeholder with compact Valuation Snapshot.
- [ ] Show only real available metrics and explicit missing inputs.
- [ ] Run tests.

### Task 3: Make long-term roadmap horizon/state aware
- [ ] Write failing tests for active support, deep-cycle support, reclaim/hold-above semantics, and structural failure.
- [ ] Separate current setup, major weekly structure, deep-cycle context, and upside sequence.
- [ ] Rename accumulation/distribution vs volume participation.
- [ ] Run tests.

### Task 4: Unify semantics and layout
- [ ] Add explicit Weekly Price Structure label.
- [ ] Ensure What Matters Now references active entry before deep-cycle support.
- [ ] Reduce empty vertical space in valuation/execution row.
- [ ] Run complete regression chain.
