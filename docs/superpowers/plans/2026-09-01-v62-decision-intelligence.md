# NIVORA V62 Decision Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn NIVORA's strong decision scaffolding into a more auditable, calibratable, adversarial and action-clear investment decision system.

**Architecture:** Preserve the V59 thesis-weight contract and V61 paper-trading safety boundary. Add focused modules for calibration quality, valuation sanity, adversarial risk and action-transition triggers; feed them into the canonical investor decision and expose them in the stock cockpit and a dedicated calibration page.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, existing NIVORA Arena/Trading Lab.

**Spec:** Approved in chat on 2026-09-01.

## Global Constraints
- No fabricated reliability percentage.
- Reuse historical calibration only when thesis weights are compatible; keep exact-engine evidence separate.
- Missing valuation remains uncertainty, never bearish evidence.
- Do not force BUY/SELL signals to create paper trades.
- Trading Lab remains paper-only.

## Completed Tasks
- [x] Calibration quality metrics and weight-compatible history
- [x] Valuation sanity checks and decision-grade evidence adjustment
- [x] Consolidation of overlapping valuation entry bands
- [x] Ranked adversarial risks
- [x] Explicit action-transition triggers
- [x] Specific material-news headline when available
- [x] Transition-aware archetype classification
- [x] Dedicated calibration dashboard
- [x] Canonical V62 versioning
- [x] Full engine regression suite
