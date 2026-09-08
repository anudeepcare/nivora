# AURYN V8.2 Security Master & Provider Coverage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make the broad live audit distinguish supported common-equity analysis from special instruments and clean provider-coverage gaps, while preserving hard blocks for true price-consistency failures.

**Architecture:** Add a deterministic Security Master before quote/history analysis, normalize market-history coverage failures into explicit non-executable states, filter audit universes to supported securities, and teach the live audit to count clean quarantines separately from critical consistency failures.

**Tech Stack:** Next.js/TypeScript, Node test runner, Twelve Data, Alpaca, Supabase.

**Spec:** Approved V8.2 scope from the live 500-symbol audit conversation.

## Global Constraints
- Never hardcode ticker decisions.
- Unsupported instruments and missing provider coverage fail closed for execution.
- Canonical/analyze price mismatch remains critical.
- Existing V8.1 Market Truth semantics remain unchanged.
- No secrets in generated packages.

---

### Task 1: Security Master
- [x] Add deterministic instrument classification for common/class shares, preferreds, warrants, rights, units, temporary/when-issued securities and unknowns.
- [x] Add focused tests using symbols exposed by the live audit.

### Task 2: Provider Coverage State
- [x] Normalize missing/404/insufficient market history into explicit coverage status.
- [x] Return structured fail-closed analysis responses instead of generic 500s where coverage is the issue.

### Task 3: Audit Universe Hygiene
- [x] Exclude unsupported instrument types from the 500-stock common-equity audit and refill to the requested supported count.
- [x] Report exclusions/quarantines separately from critical failures.

### Task 4: Live Audit Semantics
- [x] Treat unsupported/security coverage states as quarantined, not critical.
- [x] Keep canonical/analyze price mismatches and unsafe tradability as critical.

### Task 5: Verification & Packaging
- [x] Run focused tests.
- [x] Run full regression suite.
- [x] Run 100-ticker offline reality audit and production audit.
- [x] Package clean source and verify extracted ZIP.
