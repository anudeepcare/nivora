# AURYN V9.9 Autonomous Validation Lab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the unattended validation, shadow-CIO persistence, job orchestration, rate limiting, watchdog, model-health reporting, and continuity artifacts for V9.9.

**Architecture:** Vercel cron invokes lightweight routes that persist durable Supabase runs/jobs. A provider-budget module coordinates background capacity; workers process small idempotent batches and append immutable snapshots. Pure validation modules remain runnable locally/CI and feed production model-health reports.

**Tech Stack:** Next.js route handlers, TypeScript, Supabase/PostgreSQL, Vercel Cron, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-auryn-v990-autonomous-validation-lab.md`

## Global Constraints
- No UX/component/CSS/PWA/layout changes.
- V9.8 remains the canonical engine baseline.
- Background provider cap = 42 calls/minute; configured plan ceiling = 55/minute.
- No automatic production model promotion.
- Shadow predictions are immutable append-only observations.
- All background jobs are idempotent and retryable.
- Local validation remains runnable without Supabase credentials.

---

### Task 1: Pure validation lab
**Files:**
- Create: `lib/auryn/v99/validation-lab.ts`
- Create: `lib/auryn/v99/golden-fixtures.ts`
- Test: `tests/auryn-v990-validation-lab.test.mjs`

**Interfaces:**
- `runAurynValidationLab()` returns deterministic PASS/WATCH/FAIL checks and fingerprint.
- Golden fixtures exercise action reachability, three-clock isolation and valuation independence.

- [ ] Write failing deterministic validation tests.
- [ ] Verify RED.
- [ ] Implement pure validation modules.
- [ ] Verify GREEN.

### Task 2: Background rate budget and durable job model
**Files:**
- Create: `lib/auryn/v99/rate-budget.ts`
- Create: `lib/auryn/v99/jobs.ts`
- Test: `tests/auryn-v990-jobs-rate-budget.test.mjs`

**Interfaces:**
- Background budget defaults to 42/minute.
- Jobs expose deterministic idempotency keys, retry backoff and lease expiry behavior.

- [ ] Write failing budget/job tests.
- [ ] Verify RED.
- [ ] Implement modules.
- [ ] Verify GREEN.

### Task 3: Supabase schema
**Files:**
- Create: `supabase/migrations/20260912090000_auryn_v99_validation_lab.sql`
- Create: `AURYN_V9_9_SUPABASE_SETUP.md`
- Test: `tests/auryn-v990-schema-contract.test.mjs`

**Interfaces:**
- Tables: validation runs/jobs/universe/shadow snapshots/outcomes/model registry/model health/rate buckets.
- Unique keys enforce idempotency.
- SQL helper function acquires background provider tokens atomically.

- [ ] Write schema contract test first.
- [ ] Verify RED.
- [ ] Add migration + setup instructions.
- [ ] Verify GREEN.

### Task 4: Vercel cron orchestration routes
**Files:**
- Create: `app/api/validation/orchestrate/route.ts`
- Create: `app/api/validation/worker/route.ts`
- Create: `app/api/validation/watchdog/route.ts`
- Create: `app/api/validation/model-health/route.ts`
- Modify: `vercel.json`
- Test: `tests/auryn-v990-cron-routes.test.mjs`

**Interfaces:**
- Cron routes authenticate using `CRON_SECRET`.
- Orchestrator writes jobs only.
- Worker leases bounded batches.
- Watchdog retries stale/failed work.
- Model-health aggregates immutable snapshots/outcomes.

- [ ] Write route/cron contract tests.
- [ ] Verify RED.
- [ ] Implement route handlers and schedules.
- [ ] Verify GREEN.

### Task 5: Shadow CIO persistence helpers
**Files:**
- Create: `lib/auryn/v99/shadow-cio.ts`
- Create: `lib/auryn/v99/outcomes.ts`
- Test: `tests/auryn-v990-shadow-cio.test.mjs`

**Interfaces:**
- Fingerprinted snapshot payloads are immutable.
- Outcome horizons are deterministic from evaluation date.
- Champion and challenger share frozen evidence metadata but retain separate model versions.

- [ ] Write failing immutability/fingerprint/horizon tests.
- [ ] Verify RED.
- [ ] Implement helpers.
- [ ] Verify GREEN.

### Task 6: Release gate and continuity
**Files:**
- Create: `scripts/run_v990_validation_lab.mjs`
- Create: `AURYN_CANONICAL_CONTEXT.md`
- Create: `AURYN_V9_9_RELEASE.md`
- Create: `AURYN_V9_9_DEPLOYMENT_STEPS.md`
- Create: `AURYN_V9_9_VERIFICATION.txt`
- Modify: `package.json`
- Modify: `tsconfig.engine.json`

**Interfaces:**
- `npm run validate:auryn` runs V9.9 pure validation and regression suites.
- Canonical context is sufficient to resume the project in a new chat.

- [ ] Add V9.9 scripts and engine compile inputs.
- [ ] Run fresh V9.9 gate.
- [ ] Run full repository test suite and compare to V9.8 baseline.
- [ ] Package release without `.next`, `.engine-test`, or `node_modules`.
