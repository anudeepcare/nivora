# Portfolio Pulse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Portfolio Pulse on the existing Portfolio page that gives immediate portfolio intelligence and safely accumulates exact history.

**Architecture:** Extend `lib/v65/portfolio.ts` with pure Pulse calculations and keep presentation in focused Portfolio Pulse components. Add a snapshot schema/API for exact future history, while the first release remains useful immediately from current holdings and never fabricates prior portfolio performance.

**Tech Stack:** Next.js, React, TypeScript, Supabase, existing NIVORA V65 APIs/CSS, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-04-portfolio-pulse-design.md`

## Global Constraints
- Mobile first; desktop expands without becoming a dashboard.
- Preserve V65.10.1 company thesis/action behavior.
- Portfolio risk changes sizing, not company thesis.
- Exact historical portfolio claims require snapshots.
- Periods: 1D, 1W, 1M, 3M, 6M, YTD, 1Y, 2Y, 3Y, 4Y, ALL.
- SPY and QQQ are supported benchmarks; matched benchmark remains extensible.
- No new chart dependency; use lightweight SVG/HTML visuals.

---

### Task 1: Pulse intelligence model
**Files:** Modify `lib/v65/portfolio.ts`; Test `tests/v6511-portfolio-pulse.test.mjs`
**Produces:** `calculatePortfolioPulse()` returning health, allocations, concentration, contribution-to-cost, decisions and benchmark/history availability.
- [ ] Write failing pure-function tests for score labels, concentration, cost-basis contribution, and truthful missing-history state.
- [ ] Run the focused tests and confirm failure.
- [ ] Implement the pure calculation without network calls.
- [ ] Run focused tests and confirm pass.

### Task 2: Exact snapshot persistence
**Files:** Create `supabase/20260904_v6511_portfolio_pulse.sql`; Create `app/api/portfolio/pulse/route.ts`; Test `tests/v6511-portfolio-pulse-api.test.mjs`
**Produces:** user-scoped daily portfolio snapshots with total value, holding values/weights, SPY/QQQ values when available, and engine version.
- [ ] Write schema/API contract tests.
- [ ] Confirm they fail.
- [ ] Add RLS-protected snapshot tables and GET/POST route.
- [ ] Confirm tests pass.

### Task 3: Mobile-first Pulse hero and time navigation
**Files:** Create `components/portfolio/PortfolioPulse.tsx`; Modify `app/portfolio/page.tsx`; Modify `app/globals.css`; Test `tests/v6511-portfolio-pulse-ui.test.mjs`
**Produces:** first-view health/value summary, plain-English Pulse sentence, and compact time selector.
- [ ] Write failing UI contract tests for Pulse, health, time periods, and Actual-vs-Backtest labeling.
- [ ] Confirm failure.
- [ ] Implement component and responsive CSS.
- [ ] Confirm tests pass.

### Task 4: Performance and benchmark visual
**Files:** Create `components/portfolio/PortfolioPerformanceChart.tsx`; Modify `components/portfolio/PortfolioPulse.tsx`; Test `tests/v6511-portfolio-chart.test.mjs`
**Produces:** dependency-free SVG chart with Portfolio, SPY and QQQ toggles and empty-history truth state.
- [ ] Write failing chart/benchmark tests.
- [ ] Confirm failure.
- [ ] Implement accessible SVG chart and benchmark toggles.
- [ ] Confirm pass.

### Task 5: Drivers, risk and decisions
**Files:** Create `components/portfolio/PortfolioDrivers.tsx`, `components/portfolio/PortfolioRiskMap.tsx`, `components/portfolio/PortfolioActions.tsx`; Modify `components/portfolio/PortfolioPulse.tsx`; Test `tests/v6511-portfolio-decisions.test.mjs`
**Produces:** contribution bars, concentration/theme/risk summary, and ADD/HOLD/WATCH/TRIM RISK/AVOID decision cards.
- [ ] Write failing tests that preserve company action separately from portfolio sizing.
- [ ] Confirm failure.
- [ ] Implement visuals and action derivation.
- [ ] Confirm pass.

### Task 6: Integrate and regress
**Files:** Modify `app/portfolio/page.tsx`, `package.json`, release notes.
- [ ] Add all V65.11 tests to `test:engine`.
- [ ] Run the complete regression suite.
- [ ] Run TypeScript/Next build where dependencies are available.
- [ ] Verify Stock/Crypto/Cash add/edit/delete remains intact.
- [ ] Package release only after tests pass.
