# NIVORA V60 Live Adaptive Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add session-aware live pricing, explicit scan freshness, provider observability, production-safe rate-limit status, decision-stability metrics, and V60 versioning without redesigning V59 scoring.

**Architecture:** Keep the V59 investor engine contract frozen. Add small, focused V60 modules around live market state, infrastructure observability and validation, then integrate them through APIs and UI.

**Tech Stack:** Next.js 15, React 19, TypeScript 5.7, Supabase, Twelve Data, Node test runner, Python scanner.

**Spec:** `docs/superpowers/specs/2026-09-01-v60-live-adaptive-hardening-design.md`

## Global Constraints
- V59 scoring behavior remains regression-compatible.
- No fabricated extended-hours or overnight prices.
- Missing live data must degrade freshness/status, not thesis score.
- Production rate-limit mode must be observable.
- New pure engine utilities must be included in `tsconfig.engine.json` and engine tests.

---

### Task 1: Market Session and Quote Contracts
**Files:** Create `lib/nivora-market-session.ts`, `lib/nivora-live-quote.ts`; test `tests/v60-market-session.test.mjs`.
**Interfaces:** Produces `marketSessionAt`, `quoteFreshness`, `normalizeTwelveQuote`.
- [ ] Write tests for premarket/regular/after-hours/closed and stale quote handling.
- [ ] Run tests and confirm RED because modules are absent.
- [ ] Implement the pure contracts.
- [ ] Compile engine and confirm GREEN.

### Task 2: Live Quote API and Stock UI
**Files:** Create `app/api/quote/[symbol]/route.ts`; modify `components/StockClient.tsx`.
**Interfaces:** API returns provider-neutral live quote object.
- [ ] Add a source-contract test requiring `prepost=true` and explicit session/freshness fields.
- [ ] Confirm RED.
- [ ] Implement low-TTL shared/coalesced Twelve quote fetch.
- [ ] Poll quote separately from daily analysis and render session/source/update-age labels.

### Task 3: Freshness and Adaptive Discover
**Files:** Modify `app/api/discover/route.ts`, `scripts/scan_us_market.py`; create `lib/nivora-scan-freshness.ts`.
**Interfaces:** Produces 24h/7d/30d freshness distribution and priority score helper.
- [ ] Write failing tests for freshness bucket math and priority ordering.
- [ ] Implement helpers and expose coverage fields in Discover.
- [ ] Preserve stale-first scanner behavior while adding explicit priority inputs.

### Task 4: Provider SLO and Rate-Limit Observability
**Files:** Modify `lib/provider-resilience.ts`, `lib/shared-cache.ts`, `lib/rate-limit.ts`, `app/api/system/health/route.ts`.
**Interfaces:** Provider snapshot includes requests, coalesced joins, average/last latency, failures/error rate; rate-limit status reports production degradation.
- [ ] Write failing provider metrics tests.
- [ ] Implement counters and request instrumentation.
- [ ] Expose runtime health and production rate-limit configuration state.

### Task 5: Decision Stability and V60 Versioning
**Files:** Create `lib/nivora-decision-stability.ts`; modify `lib/nivora-version.ts`, calibration/version UI references, release notes.
**Interfaces:** Produces action transition classification and material-evidence stability metrics.
- [ ] Write failing stability tests.
- [ ] Implement utility and V60 constants.
- [ ] Keep V59 decision semantics intact while versioning infrastructure as V60.

### Task 6: Verification and Packaging
**Files:** Modify `package.json`, `tsconfig.engine.json`; create `V60_LIVE_ADAPTIVE_HARDENING_RELEASE.md`.
- [ ] Include all V60 pure modules/tests in engine suite.
- [ ] Run full engine tests.
- [ ] Run TypeScript/Next build when dependencies are available.
- [ ] Package source without `.env.local`, `.git`, `.next`, `node_modules`, macOS metadata.
