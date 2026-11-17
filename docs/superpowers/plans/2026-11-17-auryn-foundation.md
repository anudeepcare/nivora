# Auryn Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fresh local Auryn research app with secure provider boundaries, explainable analytics, responsive grid-only scrolling, and reproducible 509+ ticker validation.

**Architecture:** A Vite React client consumes a Node service. Framework-independent domain modules implement normalized provider contracts, Pace, scenarios, and validation; adapters add server-side credentials and rate-aware caching.

**Tech Stack:** Node 20, TypeScript, React, Vite, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-11-17-auryn-design.md`

## Global Constraints

- Do not reuse previous app code; use only SentiSense Pro and EODHD adapters.
- Never expose credentials, assume entitlements, or label fixture data live.
- No production deployment; grid scrolling only.
- Figma styling remains explicitly unimplemented until authenticated inspection is possible.

## Review Focus

- Missing credentials return typed unavailable responses without outbound calls.
- Throttling honors retry hints and cache freshness.
- Sparse/invalid histories produce insufficient-data explanations.
- Mobile shells remain fixed and only grids scroll.
- Coverage separates structural validation from live provider coverage.

---

### Task 1: Shell and provider contracts

Create `package.json`, TypeScript/Vite config, `src/domain/market.ts`, `src/server/config.ts`, `src/server/cache.ts`, and cache/config tests. Produce `MarketSnapshot`, `ProviderEnvelope<T>`, and `RateAwareCache.getOrLoad()`; test TTL, deduplication, missing credentials, and stale rejection before implementation.

### Task 2: Explainable analytics

Create `src/domain/pace.ts`, `scenarios.ts`, `dcaComparison.ts`, and tests. Produce `calculatePace(history)`, `calculateScenarios(snapshot, history)`, and `compareReference(rows)` with contributions/caveats. Test monotonic, volatile, sparse, non-finite, and scenario-ordering inputs before implementation.

### Task 3: Provider adapters and API

Create EODHD/SentiSense adapters, server routes, tests, and `.env.example`. Test URL construction, redaction, normalization, 401/403/429 handling, and fixture labeling with mocked fetch before implementation. Produce `/api/health`, `/api/quote/:symbol`, and `/api/research/:symbol`.

### Task 4: Responsive research UI

Create React app, API client, components, styles, and component tests. Test navigation, provenance labels, search, explanations, and grid overflow ownership before implementation. Build overview, screener, research, portfolio, and settings routes with mobile bottom navigation.

### Task 5: 509+ ticker validation

Create validation domain, script, tests, `artifacts/coverage.json`, and report. Test count invariants for 512 deterministic symbols. Implement offline structural validation and optional credential-gated live mode; never call offline results provider coverage.

### Task 6: Desktop/mobile verification

Create Playwright config/specs and README. Verify routes, search, error states, explanations, provenance, and grid-only overflow at 1440x900 and 390x844. Run unit tests, typecheck, build, coverage validation, and Playwright; document exact gaps.
