# NIVORA V64.1 Consistency & Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild NIVORA's decision presentation and validation layer so every ticker follows one coherent action/valuation/risk contract.

**Architecture:** Add a pure cross-system consistency validator and a decision-presentation adapter between the engine and UI. Keep canonical scoring math untouched unless policy tests prove a contradiction; prove BUY/ADD reachability with deterministic policy fixtures. Replace hover-only metric help with click/tap details and restore scenario valuation as an explicit decision section.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Twelve Data, Alpaca Paper.

**Spec:** `docs/superpowers/specs/2026-09-01-v64-1-consistency-correctness-design.md`

## Global Constraints
- No tuning merely to manufacture BUY signals.
- Missing/unavailable data is never numeric zero.
- Technical risk and fundamental invalidation are distinct.
- Analyst consensus is context only.
- Paper execution remains paper-only.
- `vercel.json` remains Hobby-compatible `{}`.
- All V54–V64 regression tests must continue to pass.

---

### Task 1: Cross-system invariant engine
- [ ] Write failing tests for contradictory states.
- [ ] Implement `validateDecisionConsistency`.
- [ ] Surface warnings/blockers in decision output.

### Task 2: Decision-policy reachability audit
- [ ] Add deterministic fixtures for BUY/ADD/WAIT/HOLD/TRIM/SELL/AVOID.
- [ ] Verify BUY and ADD are reachable without bypassing veto/timing rules.
- [ ] Add policy-distribution audit helper.

### Task 3: Price/valuation presentation adapter
- [ ] Add action-aware zone labels.
- [ ] Collapse equal low/high ranges.
- [ ] Restore Bear/Base/Bull cards with upside/downside.
- [ ] Separate technical risk and thesis invalidation.

### Task 4: Click/tap metric help
- [ ] Replace hover-only info behavior with accessible popover/dialog.
- [ ] Include meaning, source, formula version, freshness and validation status.
- [ ] Verify keyboard/mobile behavior.

### Task 5: UX consistency rebuild
- [ ] Remove duplicated legacy score panel from the primary decision path.
- [ ] Demote analysts to External Context.
- [ ] Consolidate model evidence.
- [ ] Mobile-first responsive verification.

### Task 6: Verification and package
- [ ] Run full tests.
- [ ] Run source/type/build checks where dependencies permit.
- [ ] Verify Hobby Vercel config.
- [ ] Package without secrets/generated artifacts.
