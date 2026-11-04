# AURYN broad build Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver the agreed useful research depth inside a simple, fast workspace.
**Architecture:** Pure analysis functions consume normalized research; components render those results and reuse the account cache. Provider adapters remain server-only, authenticated endpoints bound requests and retain partial results.
**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, existing EODHD/Twelve adapters.
**Spec:** docs/BROAD_BUILD_SPEC.md

## Global Constraints
No invented data, no added subscription, no credentials in client code, no live orders or deployment. Preserve approved design and old working document scroll. Expose coverage and dates without vendor clutter in main screens.

## Review Focus
- Currency/ADR mismatches must not enter numerical valuation or peer rankings.
- Missing/nonpositive denominators must remain unavailable, never become zero.
- Thin/short data must not produce invented performance or signals.
- Cached account data must remain isolated across sessions and symbols.
- Late requests and keyboard navigation must not move the document unexpectedly.

### Task 1: Coverage and requirements
Files: docs/BROAD_BUILD_SPEC.md, docs/DATA_COVERAGE_REVIEW.md, docs/BROAD_BUILD_STATUS.md; existing adapters and API fixtures.
- [x] Audit current endpoints, normalization and accessible capabilities; correct earlier documentation.
- [x] Record existing/new/blocked coverage for every agreed area with source paths.

### Task 2: Research perspectives and historical trends
Files: lib/research-workbench.ts, components/ResearchWorkbench.tsx, components/Research.tsx, components/FinancialPicture.tsx, app/globals.css; tests/research-workbench.test.mjs.
Interfaces: researchViews(Research) yields dated business/valuation/timing perspectives; financialTrend(Research, scope) yields dated comparable points; comparisonRows(Research[]) yields comparable values with missing evidence explicit.
- [x] Write failing tests for trends, missing metrics, currency comparability and horizon labels.
- [x] Implement deterministic computations and separated readable UI; reuse normalized facts and history.
- [x] Verify tests, component rendering and production build.

### Task 3: Professional comparison and export
Files: components/ResearchCompare.tsx, lib/research-workbench.ts, components/Research.tsx; tests/research-workbench.test.mjs.
- [x] Test CSV escaping and comparable-period rules.
- [x] Implement bounded user-selected research comparison using shared cache; no automatic peer invention or global scan.
- [x] Provide accessible table and CSV with timestamps, units and missing states.

### Task 4: Holdings briefing and portfolio context
Files: lib/holdings-brief.ts, components/HomeUpdates.tsx, components/Workspace.tsx; tests/holdings-brief.test.mjs.
- [x] Test movement/concentration/partial pricing and change detection against prior observed research.
- [x] Implement portfolio context and material-change briefing with dated observations; no fabricated historic returns.
- [x] Verify no extra full-universe provider waterfall.

### Task 5: Alerts and DCA
Files: lib/monitor.ts, components/AlertCenter.tsx, components/Research.tsx, components/ResearchLab.tsx and relevant tests.
- [x] Audit and test existing alert deduplication, zone confirmations, earnings rules and hypothetical DCA comparisons.
- [x] Add missing configurable event conditions supported by actual data; explain confirmed/forming/touch distinction.
- [x] Keep paper execution guarded and separate from research labels.

### Task 6: Interaction and verification
Files: components/Shell.tsx, Search.tsx, Session.tsx, app/globals.css and regression tests.
- [x] Review loading, accessibility, search, theme, footer and responsive grids.
- [x] Run npm run verify, npm run test:api and git diff --check; inspect available browser environment.
- [x] Record actual validation scope, outstanding blockers and deploy steps; package one full-source ZIP only after the review.

Acceptance note: implementation/verification tasks executed within the limits in docs/BROAD_BUILD_STATUS.md. Physical/browser/live-data gates remain unresolved, not checked off as passed. No Git commit or deployment was performed on this mixed existing working tree.
