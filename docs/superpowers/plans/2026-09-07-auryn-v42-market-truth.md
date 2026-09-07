# AURYN V4.2 Market Truth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make market price and price-sensitive decisions deterministic, fail-closed, and synchronized across the entire stock experience.

**Architecture:** Introduce a canonical market-snapshot domain above provider consensus. Market/session/calendar logic verifies whether a price may be used, the quote API returns the snapshot, and StockClient/action-plan logic consumes only the snapshot decision price. Thesis/business research can remain available when price-sensitive output is blocked.

**Tech Stack:** TypeScript, Next.js 15 route handlers, React 19, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-07-auryn-v42-market-truth-design.md`

## Global Constraints
- No ticker-specific hardcoding for IREN, NBIS, BE, CIFR, PRCT, or SAP.
- No stale or materially disagreeing provider price may become a canonical decision/display price.
- Missing/unverified data must never be converted to zero or silently substituted.
- Existing paper-trading risk gates remain stricter than research display gates.
- All price-sensitive UI must consume one `decisionPrice` from one snapshot.
- Full engine regression suite must pass before packaging.

---

### Task 1: Exchange calendar and session truth
**Files:**
- Modify: `lib/nivora-market-session.ts`
- Test: `tests/v42-market-truth.test.mjs`

**Interfaces:**
- Produces: `marketCalendarAt(date): {session, calendarState, isTradingDay, regularCloseMinutes}`
- Preserves: `marketSessionAt(date): MarketSession`

- [ ] Write failing tests for Labor Day, Thanksgiving, Christmas observed, weekend, regular day, and early-close transition.
- [ ] Run focused test and verify RED.
- [ ] Implement deterministic U.S. equity calendar/session logic.
- [ ] Run focused test and verify GREEN.

### Task 2: Canonical market snapshot
**Files:**
- Create: `lib/auryn/market-truth.ts`
- Modify: `lib/nivora-provider-consensus.ts`
- Modify: `lib/nivora-trading-market-data.ts`
- Test: `tests/v42-market-truth.test.mjs`

**Interfaces:**
- Consumes: normalized provider quotes + calendar truth + TwelveData regular close.
- Produces: `buildCanonicalMarketSnapshot(input): CanonicalMarketSnapshot`.

- [ ] Write failing tests for agreeing providers, single source, 16% disagreement, 80% disagreement, stale-only providers, and market-closed official-close behavior.
- [ ] Run focused test and verify RED.
- [ ] Implement snapshot type/builder with no suspect `chosen` price in blocked states.
- [ ] Run focused test and verify GREEN.

### Task 3: Quote API contract
**Files:**
- Modify: `app/api/quote/[symbol]/route.ts`
- Test: `tests/v42-market-truth-ui.test.mjs`

**Interfaces:**
- Produces JSON fields: `snapshotId`, `priceState`, `decisionPrice`, `displayPrice`, `regularClose`, `priceSensitiveAllowed`, `decisionAllowed`, `calendarState`, `reason`, `sources`.

- [ ] Write failing source-contract tests requiring canonical snapshot fields and forbidding stale chosen-price fallback.
- [ ] Run focused test and verify RED.
- [ ] Return canonical snapshot in quote route, retaining compatibility fields only when verified.
- [ ] Run focused test and verify GREEN.

### Task 4: Stock page price invariant and fail-closed UX
**Files:**
- Modify: `components/StockClient.tsx`
- Modify: `components/stock/StockDecisionSummary.tsx`
- Modify: `components/stock/StockTabContext.tsx`
- Modify: `app/auryn-product.css`
- Test: `tests/v42-market-truth-ui.test.mjs`

**Interfaces:**
- StockClient derives `marketTruth` once and passes `decisionPrice` to all price-sensitive calculations.
- Action-plan component renders prices only when `priceSensitiveAllowed=true`.

- [ ] Write failing tests proving StockClient no longer uses `liveQuote?.price || d.price` and suppresses action-plan prices when blocked.
- [ ] Run focused test and verify RED.
- [ ] Replace mixed-price logic with canonical decision price and blocked-state UX.
- [ ] Run focused test and verify GREEN.

### Task 5: Decision/evidence synchronization gate
**Files:**
- Modify: `lib/auryn/v4/current-evidence-adapter.ts`
- Modify: `lib/auryn/v4/presentation.ts`
- Modify: `components/stock/StockThesisPanel.tsx`
- Test: `tests/v42-market-truth-ui.test.mjs`

**Interfaces:**
- Price verification state is explicit evidence metadata.
- Structural thesis may remain valid while price-sensitive action is blocked.

- [ ] Write failing tests for strong thesis + unverified price = thesis visible, price action blocked.
- [ ] Run focused test and verify RED.
- [ ] Implement the evidence/decision presentation split without creating a second verdict.
- [ ] Run focused test and verify GREEN.

### Task 6: Trading and regression gates
**Files:**
- Modify only if needed: `app/api/trading-lab/run-paper/route.ts`, `app/api/trading-lab/diagnostics/route.ts`
- Test: `tests/v42-market-truth.test.mjs`, existing trading suites.

**Interfaces:**
- Execution requires canonical verified market truth plus existing trading-risk approval.

- [ ] Add failing trading-market-truth contract if current execution can consume a blocked snapshot.
- [ ] Run focused test and verify RED if applicable.
- [ ] Wire canonical gate into execution path if required.
- [ ] Run focused tests and verify GREEN.
- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run audit:v65` and require pass.
- [ ] Run `git diff --check` and require pass.
- [ ] Attempt `npm run build`; report environment/dependency blockers accurately.
