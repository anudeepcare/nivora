# NIVORA V65.12 Portfolio Intelligence + Global Mobile UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn V65.11 into a mobile-first portfolio analyst with working period/benchmark intelligence and a readable shared UX baseline across Analyze, Portfolio and Trading Lab.
**Architecture:** Keep company thesis truth in the existing V65 engine, add portfolio-period calculations as pure functions, and make portfolio sizing a separate overlay. Rework Portfolio into focused components and shared mobile typography/info/nav primitives without changing production scoring or paper execution.
**Tech Stack:** Next.js, React, TypeScript, Supabase, existing NIVORA V65 engine, lucide-react, dependency-free SVG.
**Spec:** `docs/superpowers/specs/2026-09-04-v6512-portfolio-intelligence-ux-design.md`

## Global Constraints
- Mobile first; body copy generally 15–16px on narrow screens.
- Info affordance is standalone `i`, no visible circle/background.
- Company action and portfolio action remain separate.
- Never fabricate actual historical portfolio returns.
- SPY and QQQ are first-class benchmarks.
- Preserve Stock/Crypto/Cash CRUD and Trading Lab paper-only safety.

### Task 1: Shared readability and info affordance
Modify `components/v65/MetricInfo.tsx`, `app/globals.css`; test `tests/v6512-global-mobile-ux.test.mjs`. Red/green tests for standalone i, >=40px tap target, viewport-safe popover and mobile type scale.

### Task 2: Period engine and benchmark truth
Modify `lib/v65/portfolio.ts`; test `tests/v6512-portfolio-periods.test.mjs`. Add `calculatePortfolioPeriod(history, period, now)` for every supported period, insufficient-history states, SPY/QQQ and alpha.

### Task 3: Market hero and working periods
Modify `components/portfolio/PortfolioPulse.tsx`, `PortfolioPerformanceChart.tsx`; test `tests/v6512-market-hero.test.mjs`. Selected period must change chart, You/SPY/QQQ metrics, alpha and verdict.

### Task 4: Holdings Intelligence
Create `components/portfolio/HoldingsIntelligence.tsx`; modify `app/portfolio/page.tsx`; test `tests/v6512-holdings-intelligence.test.mjs`. Mobile holding detail with Shares/Units/Amount, company evidence and separate portfolio action; consolidate cash.

### Task 5: Drivers, Action Center and X-Ray
Create `PortfolioActionCenter.tsx`, `PortfolioXRay.tsx`; modify Pulse; test `tests/v6512-portfolio-actions.test.mjs`. New-money/do-not-add/watch/trim/avoid plus position/sector/theme/crypto/cash concentration without changing company thesis.

### Task 6: Cross-app mobile readability
Modify shared nav, Analyze presentation, Trading Lab and globals; test `tests/v6512-cross-app-readability.test.mjs`. Consistent restrained glass navigation and readable hierarchy.

### Task 7: Snapshot/benchmark lifecycle
Modify `app/api/portfolio/pulse/route.ts`, `app/portfolio/page.tsx`; test `tests/v6512-snapshot-lifecycle.test.mjs`. Idempotent daily snapshot refresh; benchmark failure must not corrupt portfolio snapshot.

### Task 8: Regression and release
Add V65.12 tests to `test:engine`, run full suite and TypeScript/Next build where dependencies exist, verify Stock/Crypto/Cash CRUD and Trading Lab paper-only safety, then package.
