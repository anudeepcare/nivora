# AURYN Pace Product Refinement Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. User approved execution; continue without another approval loop.

**Goal:** Deliver all 24 approved improvements with reusable Pace language and contextual guidance.
**Architecture:** Central presentation policy over the existing decision model; shared help and responsive styling; targeted provider and tool-flow repairs.
**Tech Stack:** Next.js 15, React 19, TypeScript, Node tests, lightweight-charts.
**Spec:** docs/superpowers/specs/2026-10-27-pace-product-refinement.md

## Global Constraints
Preserve the approved design, all useful metrics, access checks and source lineage. No fabricated financial data. P means Pace everywhere. No production deployment.

## Review Focus
- Distressed business with P4 price reading: never an unqualified accumulation instruction.
- Positive operating cash flow and heavy expansion spending: not automatically distressed.
- One invalid comparison: retain successful peers and identify the failed selection.
- Retained hidden chart reopened: use the available width and correct time range.
- Small screen, dark theme and keyboard help: readable controls, no overflow or nested interactive elements.

### Task 1: Unified Pace, funding and movement
Files: lib/auryn-decision.ts, lib/edge-research.ts, lib/pace-presentation.ts, components/PaceHelp.tsx, components/ApprovedResearch.tsx, components/MovementContext.tsx; tests/pace-product.test.mjs and existing movement component tests.
- [x] Reproduce decision/Pace and missing-change label defects with behavioural tests (expected failure).
- [x] Implement pacePresentation(action, multiplier), fundingRisk(input), and leading valuation explanation.
- [x] Integrate shared help and presentation; run focused tests (expected pass).

### Task 2: Branding, header and chart consistency
Files: components/Research.tsx, AccumulationDesk.tsx, ApprovedWorkspace.tsx, Charts.tsx, lib/approved-research.ts, research header and help surfaces.
- [x] Cover level formatting, unknown level and paused-vs-P0 behaviour.
- [x] Replace user-facing multiplier branding with P levels, preserving mathematical multipliers in methodology.
- [x] Add applicable header metrics and visibility-aware chart fitting.
- [x] Verify rendered components and typecheck.

### Task 3: Tool journeys and coverage
Files: components/SupportingViews.tsx, Discover.tsx, Shell.tsx, Product.tsx; lib/comparison.ts, provider paths as indicated by tests.
- [x] Reproduce partial comparison failure and unverified identity acceptance.
- [x] Preserve partial results, expose precise issues, consistent decision/Pace and comparison periods.
- [x] Align Explore names, permission visibility, saved/export flows and public help.
- [x] Run coverage, provider and tool-focused tests.

### Task 4: Shared density and interaction polish
Files: app/approved-mockup.css, workspace-experience.css, decision-experience.css, portfolio.css, components/Search.tsx, HoldingsImport.tsx, public/auth CSS.
- [x] Fix search trigger/form selector collision, portfolio eighth column and CSV control.
- [x] Apply shared moderate spacing, semantic colour, shorter hero/checkpoint, mobile and dialog polish.
- [x] Inspect actual desktop/mobile render and keyboard/touch flows.

### Task 5: Verification and delivery
- [x] Run npm test, npm run typecheck, npm run build and applicable API/evaluation scripts.
- [x] Record each approved point with changed files and concrete verification; distinguish unavailable external credentials.
- [x] One fresh whole-branch code review, fix important findings and rerun affected checks.
- [ ] Commit, package full source with manifest, verify archive and save deliverable. Final archive results are recorded in its release manifest and the delivery message.
