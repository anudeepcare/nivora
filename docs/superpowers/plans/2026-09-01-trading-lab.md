# NIVORA Trading Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an autonomous paper-trading laboratory on V60 with deterministic signal conversion, risk gating, execution simulation, Alpaca Paper support, audit persistence, and Arena-style trade metrics.

**Architecture:** Preserve the V60 investment engine unchanged. Create a separate trading domain that consumes frozen decisions, never writes back into scoring, and hard-separates autonomous paper execution from approval-gated live execution.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Node test runner, Alpaca Paper REST API.

**Spec:** `docs/superpowers/specs/2026-09-01-trading-lab-design.md`

## Global Constraints
- V60 scoring and valuation behavior must remain unchanged.
- Paper execution may be autonomous.
- Live-money order transmission must never be autonomous.
- All broker URLs and credentials remain server-side.
- Every order must be idempotent and auditable.
- No `.env.local` or secrets in release artifacts.

---

### Task 1: Trading Intent Contract
**Files:** Create `lib/nivora-trade-intent.ts`; test `tests/v61-trade-intent.test.mjs`.
**Produces:** `deriveTradeIntent()` and versioned `TradeIntent`.
- [ ] Write failing behavior tests for BUY/ADD, SELL/TRIM, WAIT/HOLD/NO ACTION, and blocked decisions.
- [ ] Run tests and confirm RED.
- [ ] Implement minimal deterministic intent mapping.
- [ ] Run tests and confirm GREEN.

### Task 2: Deterministic Trading Risk Engine
**Files:** Create `lib/nivora-trading-risk.ts`; test `tests/v61-trading-risk.test.mjs`.
**Produces:** `evaluateTradingRisk()` and `DEFAULT_PAPER_RISK_POLICY`.
- [ ] Write failing tests for stale quote, daily loss, concentration, spread, gap, duplicate and allowed trade.
- [ ] Run RED.
- [ ] Implement risk gates and resizing.
- [ ] Run GREEN.

### Task 3: Paper Execution and Broker Safety Boundary
**Files:** Create `lib/nivora-paper-execution.ts`, `lib/nivora-broker.ts`, `lib/alpaca-paper.ts`; test `tests/v61-paper-execution.test.mjs` and `tests/v61-broker-safety.test.mjs`.
**Produces:** deterministic limit plans, fill simulator, broker contract, Alpaca Paper adapter.
- [ ] Write RED tests for deterministic IDs, limit protection, slippage, and live approval gate.
- [ ] Implement minimal code.
- [ ] Run GREEN.

### Task 4: Trading Metrics
**Files:** Create `lib/nivora-trading-metrics.ts`; test `tests/v61-trading-metrics.test.mjs`.
**Produces:** `summarizeTradingPerformance()`.
- [ ] Write RED tests for win rate, profit factor, expectancy, drawdown and benchmark alpha.
- [ ] Implement metrics.
- [ ] Run GREEN.

### Task 5: Persistence and APIs
**Files:** Create Supabase migration and `/api/trading-lab/status`, `/evaluate`, `/run-paper` routes.
**Produces:** stored configs, intents, orders/fills and paper-cycle API.
- [ ] Add route contract tests first.
- [ ] Implement status/evaluate/paper-run with server-only credentials and secret-protected automation endpoint.
- [ ] Verify contract tests.

### Task 6: Trading Lab UI and Release Integration
**Files:** Create `/app/trading-lab/page.tsx`; modify `components/AppShell.tsx`, `app/globals.css`, `lib/nivora-version.ts`, `tsconfig.engine.json`, `package.json`; create release notes.
- [ ] Add UI/version contract tests first.
- [ ] Implement dashboard and navigation.
- [ ] Run full regression suite.
- [ ] Package source-only release ZIP.
