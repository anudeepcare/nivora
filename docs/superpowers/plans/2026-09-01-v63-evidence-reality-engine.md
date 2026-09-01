# NIVORA V63 Evidence & Reality Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-hardened V63 with market-data integrity, decision reality checks, calibrated transparency, Hobby-compatible scheduling, and a verifiable Alpaca Paper execution path.

**Architecture:** Introduce focused provider-integrity and decision-reality modules rather than growing the core investor file further. Keep Trading Lab downstream of canonical frozen decisions and move recurring scheduling to GitHub Actions. Add secret-protected diagnostics for paper broker/quote/order verification.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Twelve Data Grow, Alpaca Paper/Data APIs, GitHub Actions, Vercel Hobby.

**Spec:** `docs/superpowers/specs/2026-09-01-v63-evidence-reality-engine-design.md`

## Global Constraints
- Paper only; no autonomous live-money execution.
- No stale/disputed quote may authorize new risk.
- No hidden type assertions to silence execution-path errors.
- `vercel.json` must be Hobby-compatible.
- `npm test` and `npm run build` are release gates.
- No fabricated calibration.

---

### Task 1: Build/type hardening
- [ ] Add regression tests for quote/risk types and Vercel config.
- [ ] Normalize execution quote fields at source.
- [ ] Remove Vercel cron from `vercel.json`.
- [ ] Verify engine tests.

### Task 2: Market truth/provider consensus
- [ ] Add provider-integrity state model.
- [ ] Compare Alpaca/Twelve observations when both are available.
- [ ] Surface session, freshness, disagreement and provider provenance.
- [ ] Block execution on stale/disputed data.

### Task 3: Decision reality layer
- [ ] Add market-model disagreement.
- [ ] Add falling-knife/stabilization guard.
- [ ] Add valuation robustness/stress score.
- [ ] Add early-warning risk.
- [ ] Add score attribution and confidence-aware zone rounding.
- [ ] Surface all of these in the stock cockpit.

### Task 4: Calibration hardening
- [ ] Add archetype/horizon/regime cohort structures.
- [ ] Preserve exact-engine vs compatible-history labeling.
- [ ] Add sample-size-aware display and avoid zero-as-confidence semantics.

### Task 5: Paper trading proof path
- [ ] Add read-only broker/quote diagnostic.
- [ ] Add opt-in paper-order self-test guarded by environment flag and secret.
- [ ] Record diagnostic/audit result.
- [ ] Show operational health in Trading Lab.
- [ ] Preserve no-short and stale-quote gates.

### Task 6: Automation and verification
- [ ] Add GitHub Actions paper-runner scheduler.
- [ ] Keep Vercel Hobby config empty.
- [ ] Run full engine suite.
- [ ] Run production Next.js build.
- [ ] Package without secrets/build artifacts.
