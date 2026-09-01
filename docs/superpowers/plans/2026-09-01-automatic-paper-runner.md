# Automatic Paper Runner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make V61 paper trading autonomous, market-session aware, quote-safe, and visible from Trading Lab without manual curl.

**Architecture:** Keep the existing risk-gated run-paper endpoint as the single execution path, add a Vercel cron GET adapter authenticated by Vercel's CRON_SECRET convention, source execution quotes from Alpaca Paper's latest quote/trade API with Twelve Data fallback, and expose runner/session/quote telemetry in the existing status console. BUY/ADD may add risk only after gates; SELL/TRIM only reduce existing positions.

**Tech Stack:** Next.js 15, TypeScript, Vercel Cron, Supabase, Alpaca Paper/Data API, Twelve Data fallback.

**Spec:** Approved in chat on 2026-09-01.

## Global Constraints
- Paper only; no live-money autonomous execution.
- Do not loosen NIVORA scoring thresholds or stale-quote safety.
- Preserve idempotency and all V61 portfolio risk gates.
- SELL/TRIM must never open a short position.

---

### Task 1: Session-aware execution quote
- [ ] Write failing quote/provider tests.
- [ ] Add Alpaca latest quote/trade normalization with timestamp, bid/ask spread, and session.
- [ ] Fall back to Twelve Data only when Alpaca data is unavailable.
- [ ] Run tests.

### Task 2: Autonomous Vercel cron
- [ ] Write failing API/cron contract tests.
- [ ] Extract paper-cycle execution into a shared function.
- [ ] Support authenticated Vercel GET cron and existing diagnostic POST.
- [ ] Add `vercel.json` schedule at five-minute cadence; execution function skips closed sessions.
- [ ] Run tests.

### Task 3: Operational telemetry
- [ ] Write failing UI/status tests.
- [ ] Persist quote/session/provider telemetry with each evaluation.
- [ ] Show market session, last automatic run, quote age/provider, action badges, and clearer execution state.
- [ ] Run tests.

### Task 4: Verification/package
- [ ] Run complete engine suite.
- [ ] Run TypeScript/Next build where dependencies permit.
- [ ] Package source without secrets/node_modules/build output.
