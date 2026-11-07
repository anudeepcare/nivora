# Performance-first Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task.

**Goal:** Deliver a measured faster source build and integrated research evidence workflows, with every recovered requirement accounted for.
**Architecture:** Existing Next/React application; preserve account/session boundary and provider budgets. Split existing modules, add pure transformations over existing evidence, avoid automatic expensive data calls.
**Tech Stack:** Node 24, Next 15, React 19, TypeScript, PostCSS, node:test.
**Spec:** docs/superpowers/specs/2026-11-07-performance-first.md

## Global Constraints
Source ZIP only; no deployment or production writes. No threshold changes, invented observations or exposed private data. Compact layouts; no oversized card grids, nested boxes or decorative borders. Physical-device and licensed-data verification remain external prerequisites.

## Review Focus
- Refresh while a previous request is unresolved cannot overwrite newer results.
- Account cache clearance must discard in-flight writes.
- CSS deduplication must retain nested-media/layer/source-order semantics.
- Evidence export must exclude account holdings, notes, emails and secrets.
- Period comparisons must reject incompatible currency/basis and never treat missing values as zero.

### Task 1: Performance and cache correctness
- [x] Record current build chunk/CSS compressed sizes.
- [x] Add failing refresh/LRU/account-clear tests to tests/resource-cache.test.mjs.
- [x] Implement invalidation/clear helpers in lib/resource-cache.ts; wire Session and account-cache.
- [x] Extract useWorkspaceQuotes from the obsolete screen module; split primary workspaces at module boundaries without losing shared helpers.
- [x] Superseded by ledgered decision: route-scoped legacy CSS and fresh Options/public/owner modules; no full dead-rule cleanup claim.
- [x] Run tests, build and browser comparisons; record before/after.

### Task 2: Integrated research evidence
- [x] Add pure tested receipts, earnings brief, opposing-case evidence and privacy-safe Markdown export.
- [x] Render an on-demand compact ResearchEvidence component and integrate in Research.
- [x] Compare bounded user-selected filing passages as text with original source links; no fabricated automatic filing coverage.
- [x] Test invalid dates, missing facts, mismatched periods, export privacy and HTML-as-text.

### Task 3: Completion inventory and package
- [x] Reconcile recovered explicit requirements and saved backlog into done / partial / external-input rows with code evidence.
- [x] Correct env documentation and generate a configuration validator that reports missing names without printing secrets.
- [x] Run full verify/API checks and representative browser routes/menus; independent final code review.
- [x] Save full source ZIP with measurements, tests and exact remaining external dependencies.
