# NIVORA V64 Quant Validation & Proven-Edge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build V64 so NIVORA's displayed numbers are auditable, the technical engine is broker-standard, the historical backtest is point-in-time/out-of-sample safe, and product reliability labels are evidence-derived.

**Architecture:** Extract one canonical technical engine shared by production and replay. Integrate the point-in-time backtest harness, add a validation gate and metric-proof contract, then simplify the investor UX around actionable decisions and evidence. Preserve V63 market-integrity and Alpaca Paper execution.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Twelve Data, SEC EDGAR, Alpaca Paper, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-01-v64-quant-validation-proven-edge-design.md`

## Global Constraints
- Paper-only autonomous execution.
- No current analyst data may leak into historical backtests.
- Missing evidence is not zero.
- `Validated` is evidence-derived, never hardcoded.
- Wilder RSI/ATR become canonical in V64.
- V63 quote integrity and Trading Lab risk gates remain mandatory.
- `vercel.json` remains Hobby-compatible.
- Existing engine tests remain regression gates.

---

### Task 1: Canonical technical engine
**Files:** create `lib/nivora-technical-engine.ts`; modify `lib/quant.ts`; modify `app/api/analyze/[symbol]/route.ts`; test `tests/v64-quant-validation.test.mjs`.
**Interfaces:** `computeTechnicalSnapshot(rows, benchRows, benchmark)` returns all technical scores/levels used by live and replay.

- [ ] Add failing reference tests for Wilder RSI/ATR and live/backtest shared engine.
- [ ] Replace flat-average RSI/ATR with Wilder smoothing.
- [ ] Move live technical scoring to the shared pure engine.
- [ ] Run engine regressions.

### Task 2: Point-in-time backtest integration
**Files:** create `lib/nivora-backtest-fundamentals.ts`, `lib/nivora-backtest-replay.ts`, `lib/nivora-backtest-report.ts`, `scripts/run_backtest.mjs`; test `tests/v64-backtest-contract.test.mjs`.
**Interfaces:** replay rows feed existing `summarizeCalibration`.
- [ ] Add no-lookahead and insufficient-history tests.
- [ ] Add SEC filed-date slicing.
- [ ] Add benchmark-relative replay and cost model.
- [ ] Add walk-forward split and report.
- [ ] Run tests.

### Task 3: Validation gate
**Files:** create `lib/nivora-validation-gate.ts`; test `tests/v64-validation-gate.test.mjs`.
**Interfaces:** `evaluateValidationEvidence(input)` returns status, passed gates, failed gates, and evidence summary.
- [ ] Add failing tests for UNVALIDATED/BACKTESTED/OOS/FORWARD/VALIDATED transitions.
- [ ] Implement pre-registered gates.
- [ ] Verify no status can advance with insufficient samples or negative alpha.

### Task 4: Metric proof + number formatting
**Files:** create `lib/nivora-metric-proof.ts`, `lib/nivora-format.ts`; modify `lib/nivora-investor.ts`, `lib/nivora-metrics.ts`; test `tests/v64-metric-proof.test.mjs`.
**Interfaces:** core decision exposes proof metadata for Business, Opportunity, Timing, Valuation, Thesis, Reliability.
- [ ] Add failing provenance/format tests.
- [ ] Implement centralized money/percent/count/score formatters.
- [ ] Implement metric proof contracts and warnings.
- [ ] Verify unavailable values never render as zero scores.

### Task 5: Position sizing and execution-cost context
**Files:** create `lib/nivora-position-sizing.ts`; test `tests/v64-position-sizing.test.mjs`.
**Interfaces:** `sizePosition(input)` returns suggested shares/notional/risk dollars or a blocked reason.
- [ ] Add failing tests for risk-per-trade, invalidation distance, liquidity cap, and impossible setups.
- [ ] Implement bounded sizing.
- [ ] Keep Trading Lab as the final execution authority.

### Task 6: Mobile-first decision UX
**Files:** modify `components/InvestorDecisionHero.tsx`, `components/StockClient.tsx`, `app/calibration/page.tsx`, `app/globals.css`; test `tests/v64-ui-contract.test.mjs`.
- [ ] Add failing UI contract tests.
- [ ] Remove `Unavailable · 0/100` and repeated large `Collecting` blocks.
- [ ] Reorder content around Today → price zone → confirmation → invalidation → why → risks → evidence.
- [ ] Add compact provenance/evidence disclosure.
- [ ] Verify responsive/mobile layout contract.

### Task 7: Versioning, docs, and release verification
**Files:** modify `lib/nivora-version.ts`, `package.json`, docs.
- [ ] Bump canonical V64 contracts.
- [ ] Run all engine tests.
- [ ] Run TypeScript/Next production build where dependencies allow.
- [ ] Package without secrets/build outputs.
