# AURYN V9.9.8 Market Price Authority Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one session-aware display-price authority consumed consistently across AURYN.

**Architecture:** Provider adapters produce timestamped quote candidates. A pure market-price authority validates candidates, detects disagreement, chooses the newest agreeing quote, and emits one display contract. UI display-price consumers use that contract while CIO canonical/execution price remains separate.

**Tech Stack:** Next.js, React, TypeScript, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-v998-market-price-authority-design.md`

## Global Constraints
- No CIO formula, weight, threshold, or execution-safety change.
- No Supabase migration/manual SQL.
- `vercel.json` remains exactly `{}`.
- Preserve V9.9.7 autonomous workflows and V9.9.7.2 provider protections.

---

### Task 1: Pure market-price authority
**Files:** Create `lib/auryn/market-price-authority.ts`; Test `tests/auryn-v998-market-price-authority.test.mjs`.
- [ ] Write failing tests for regular, premarket, after-hours, close, disagreement, stale, newest-agreeing, symbol mismatch.
- [ ] Verify RED.
- [ ] Implement pure authority.
- [ ] Verify GREEN.

### Task 2: Fast quote API integration
**Files:** Modify `lib/auryn/fast-quote.ts`, `app/api/quote/[symbol]/route.ts`.
- [ ] Write failing integration contract.
- [ ] Verify RED.
- [ ] Return one authority contract from `/api/quote`.
- [ ] Verify GREEN.

### Task 3: Page-wide display authority
**Files:** Modify `components/StockClient.tsx`, relevant overview/chart display props.
- [ ] Write failing contract proving presentation price/status/detail derive from authority.
- [ ] Verify RED.
- [ ] Remove presentation-layer provider/canonical selection.
- [ ] Keep canonicalDecisionPrice solely for CIO/execution.
- [ ] Verify GREEN.

### Task 4: Release integrity
**Files:** Create release verifier/notes.
- [ ] Verify hidden workflows exist and legacy secret names are absent.
- [ ] Verify `vercel.json` is `{}` and no migration is added.
- [ ] Run focused tests.
- [ ] Run historical baseline and compare with 721/737 known baseline.
- [ ] Package ZIP.
