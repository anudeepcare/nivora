# AURYN V9.9.9 Portfolio Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver account-aware holdings, truthful portfolio history, better analytics/UX and faster portfolio loading.

**Architecture:** Persist positions by user+account+symbol, aggregate lots for portfolio intelligence, preserve source rows for editing, and use actual daily snapshots for period analytics.

**Tech Stack:** Next.js/React/TypeScript, Supabase/Postgres, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-v999-portfolio-intelligence-design.md`

## Global Constraints
- One Supabase migration only.
- Existing holdings migrate safely to Default account.
- No CIO/market-price/workflow changes.
- No fabricated historical performance.

### Task 1: Account-aware schema
- [ ] RED migration contract.
- [ ] Add one idempotent migration changing uniqueness and adding account/cash-flow support.
- [ ] GREEN.

### Task 2: Multi-account aggregation
- [ ] RED weighted-average/account-lot tests.
- [ ] Implement pure aggregator.
- [ ] GREEN.

### Task 3: Add/Edit/Holdings UX
- [ ] RED portfolio UI contract.
- [ ] Add account field, account-aware upsert, aggregated holding rows with lot breakdown.
- [ ] GREEN.

### Task 4: Performance analytics
- [ ] RED period/history tests.
- [ ] Extend snapshot payload and performance visual to actual stored series.
- [ ] GREEN.

### Task 5: Capital Queue + first-screen metrics
- [ ] RED ranking/UX tests.
- [ ] Improve prioritization and metrics.
- [ ] GREEN.

### Task 6: Performance + release integrity
- [ ] Deduplicate quote symbols and preserve batch loading.
- [ ] Verify hidden workflows and Vercel config.
- [ ] Run focused suite and historical baseline.
- [ ] Package release + exactly one SQL migration instruction.
