# AURYN V9.9.6 Autonomous Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drain validation jobs automatically and finalize runs only from verified Shadow CIO evidence.
**Architecture:** A bounded GitHub scheduler calls worker sequentially; Supabase controls leasing/retry/budget. A finalizer verifies job terminality and snapshot integrity before PASS/FAIL.
**Tech Stack:** Next.js, TypeScript, Supabase, GitHub Actions.
**Spec:** `docs/superpowers/specs/2026-09-12-v996-autonomous-queue-design.md`

## Global Constraints
- Keep `vercel.json` exactly `{}`.
- Preserve V9.9.5 CIO logic, universe and UX.
- Never mark PASS from job status alone.
- Keep scheduling outside Vercel Cron.
---
### Task 1: finalization integrity
Write RED tests for PASS/WATCH/FAIL evidence invariants; implement pure evaluator; GREEN.
### Task 2: finalizer endpoint
Write RED route-contract tests; implement authenticated finalizer using jobs + Shadow snapshots; GREEN.
### Task 3: bounded queue pump
Write RED tests for done/deferred/idle behavior; implement script that calls worker sequentially and finalizer; GREEN.
### Task 4: GitHub scheduler
Add workflow using `AURYN_BASE_URL` and `CRON_SECRET`, bounded cadence, concurrency lock; verify cron-free Vercel config.
### Task 5: regression gate
Run V9.9.6 focused gate and full historical baseline; package release.
