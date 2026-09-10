# AURYN V9.3.1 Institutional Reliability + Astra Analyst Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one deterministic, 24/7, cross-surface AURYN decision system with grounded expert explanations and a non-authoritative GPT-6 Astra analyst.

**Architecture:** Add V9.3.1 domain, snapshot, state, explanation and reliability modules; centralize current-price loading in a market-data gateway; expose an Astra structured-output endpoint; migrate price-bearing surfaces to canonical Market Truth; add deterministic and source-level release gates.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner, existing AURYN engines, OpenAI Responses API via fetch.

**Spec:** `docs/superpowers/specs/2026-09-09-auryn-v931-institutional-reliability-design.md`

## Global Constraints
- AURYN only as the product name.
- Research remains usable 24/7 while execution stays fail-closed.
- Astra never becomes source of market truth or execution authority.
- Preserve V9.2 and V9.3 gates.

---

### Task 1: Canonical snapshot and setup-state contracts
**Files:** create `lib/auryn/v931/domain.ts`, `decision-snapshot.ts`, `setup-state.ts`; test `tests/auryn-v931-core.test.mjs`.
- [ ] Write failing tests for stable snapshot fingerprints and allowed/hysteretic setup transitions.
- [ ] Run tests and confirm RED.
- [ ] Implement canonical stable serialization, DecisionSnapshot, and setup transition resolver.
- [ ] Run focused tests and confirm GREEN.

### Task 2: Expert decision and explanation contract
**Files:** create `lib/auryn/v931/decision-kernel.ts`, `explanation.ts`; test `tests/auryn-v931-explanations.test.mjs`.
- [ ] Write failing tests for six-pillar decisions, causal attribution and anti-generic explanation validation.
- [ ] Confirm RED.
- [ ] Implement deterministic kernel and explanation validator.
- [ ] Confirm GREEN.

### Task 3: Astra analyst boundary
**Files:** create `lib/auryn/v931/astra.ts`, `app/api/astra/[symbol]/route.ts`; test `tests/auryn-v931-astra.test.mjs`.
- [ ] Write failing tests proving `gpt-6-astra`, Responses API, strict JSON schema, evidence IDs and authority rejection.
- [ ] Confirm RED.
- [ ] Implement request/schema/validator and server route.
- [ ] Confirm GREEN.

### Task 4: One current-price gateway
**Files:** create `lib/auryn/market-data-gateway.ts`; modify `app/api/quote/[symbol]/route.ts`, `app/api/market/route.ts`, `app/api/portfolio/pulse/route.ts`, `app/api/scan/route.ts`, `app/api/investment/route.ts`; test `tests/auryn-v931-market-gateway.test.mjs`.
- [ ] Write source/behavior tests that reject direct current-price provider bypasses and require canonical snapshot fields.
- [ ] Confirm RED.
- [ ] Implement gateway and migrate current-price consumers.
- [ ] Confirm GREEN.

### Task 5: Cross-tab institutional UX
**Files:** create `components/stock/v931/InstitutionalDecisionBrief.tsx`, `AstraAnalystPanel.tsx`; modify `components/StockClient.tsx` and shared CSS; test `tests/auryn-v931-surface-contract.test.mjs`.
- [ ] Write failing source contract tests for one call, six pillars, next trigger, expert drilldown and Astra challenger.
- [ ] Confirm RED.
- [ ] Implement shared brief across the stock experience without removing expert metrics.
- [ ] Confirm GREEN.

### Task 6: Reliability Lab and release gate
**Files:** create `lib/auryn/v931/reliability.ts`, `scripts/run_v931_reliability_lab.mjs`, `scripts/run_v931_release_gate.mjs`, release doc; modify `package.json` and `tsconfig.engine.json`.
- [ ] Write failing tests for deterministic replay, cross-surface invariants, session matrix, provider chaos and release scripts.
- [ ] Confirm RED.
- [ ] Implement lab and gate.
- [ ] Run focused, full regression, V8, V9.2 and V9.3 verification.
