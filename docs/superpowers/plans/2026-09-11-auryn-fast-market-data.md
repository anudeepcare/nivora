# AURYN Fast Market Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fast research-price lane that renders active ticker price independently from deep research and execution verification.

**Architecture:** Add `lib/auryn/fast-quote.ts` and `/api/quote/[symbol]`. StockClient fetches/caches fast quote immediately and uses it only for display price. SearchBox warms likely quote endpoints. Canonical market truth continues to drive decision/execution.

**Tech Stack:** Next.js, React, TypeScript, Twelve Data, existing AURYN Market Truth.

**Spec:** `docs/superpowers/specs/2026-09-11-auryn-fast-market-data-design.md`

## Global Constraints
- Never expose provider secrets.
- Fast quote is research-display only.
- Canonical decision price and execution verification remain unchanged.
- Missing change renders unavailable, not zero.

### Task 1: Fast quote provider
- [ ] Write failing contract test.
- [ ] Create `lib/auryn/fast-quote.ts`.
- [ ] Create `app/api/quote/[symbol]/route.ts`.
- [ ] Verify provider key remains server-side and response contract marks executionVerified false.

### Task 2: Immediate StockClient render
- [ ] Write failing client contract test.
- [ ] Add module cache + in-flight coalescing for fast quote.
- [ ] Fetch fast quote immediately on symbol change.
- [ ] Use fast quote for header/display current price only.
- [ ] Keep canonical price for decision math.

### Task 3: Search warming
- [ ] Write failing prefetch contract test.
- [ ] Warm `/api/quote/[symbol]` for top likely search results.
- [ ] Keep route prefetch.

### Task 4: Status UX
- [ ] Replace giant live-verification warning with small integrity copy when fast live research price exists.
- [ ] Never show 0.00% when change is unavailable.
- [ ] Preserve degraded/reference states when no fast quote exists.

### Task 5: Release gate
- [ ] Run new tests.
- [ ] Run V9.3.8 FIX2 gate.
- [ ] Package ZIP.
