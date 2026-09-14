# AURYN V9.9.7 Autonomous Market Cycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make validation/data collection resilient to irregular GitHub cron timing, faster per wake-up, session-aware, and free of legacy secret failures.

**Architecture:** GitHub is only a wake-up signal. A market-cycle script creates any currently eligible session run, then drains Supabase jobs for a bounded time while respecting the existing 42/min provider governor. Cohorts are seeded, rotating, exchange-stratified samples.

**Tech Stack:** Next.js/TypeScript, Supabase, Node.js, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-14-v997-autonomous-market-cycle-design.md`

## Global Constraints
- Keep `vercel.json` exactly `{}`.
- Preserve CIO/research/model/UX behavior.
- Sequential provider work only; Supabase 42/min budget remains authoritative.
- Current Attempt 3 must continue without reset.

---

### Task 1: Secret standardization
- [ ] Write failing workflow contract proving Calibration Maturation uses `AURYN_BASE_URL` and `CRON_SECRET` only.
- [ ] Implement workflow change.
- [ ] Verify GREEN.

### Task 2: Rotating diversified cohorts
- [ ] Write failing tests for seeded exchange-stratified reproducibility, rotation, eligibility, and nonalphabetic behavior.
- [ ] Add optional seed to universe builder and per-kind cohort sizing.
- [ ] Verify GREEN.

### Task 3: Session run kinds and broad guarded windows
- [ ] Write failing orchestrator contract tests for LIVE_OPEN/LIVE_MIDDAY/LIVE_POWER_HOUR plus existing lifecycle kinds.
- [ ] Extend run-kind type and orchestrator guarded windows.
- [ ] Verify GREEN.

### Task 4: Duration-based resilient drain
- [ ] Write failing script contract proving fixed 10-worker limit is removed, deferred waits/retries, and watchdog/finalizer always run.
- [ ] Implement bounded duration/max-job runner.
- [ ] Verify GREEN.

### Task 5: Market-cycle scheduler
- [ ] Add script that calls orchestrate for lifecycle kinds then drains queue.
- [ ] Point GitHub workflow at market-cycle script with a bounded timeout and concurrency.
- [ ] Verify cron-free Vercel config.

### Task 6: Regression verification and release
- [ ] Run focused V9.9.7 gate.
- [ ] Run historical suite and compare to 721/737 known baseline.
- [ ] Package release ZIP.
