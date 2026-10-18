# Approved AURYN Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Implement the user-approved responsive AURYN design on the existing connected application, including reliable navigation.

**Architecture:** Preserve the provider, research, account and trading services. Replace the visual shell and layout with the frozen prototype styles and focused React presentation components; use existing typed evidence for displayed values.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Lightweight Charts, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-17-approved-studio.md`

## Global Constraints

- Approved reference: `docs/design/approved-studio-20261017.html`.
- Five research tabs: Overview, Financials, Value, Technicals, Thesis.
- No prototype sample price, scenario or technical values in live research.
- No provider-secret exposure, paid AI activation, broker execution, database migration or deployment.
- Unknown values remain unknown; crypto and ADR identity/currency guards remain active.

## Review Focus

- A saved list position exceeds the height of its initial loading state: restore only after content is tall enough.
- A user scrolls during loading: cancel pending automatic restoration.
- A stale/foreign-currency/negative-EPS instrument has no valid outlook: withhold targets and explain the missing input.
- Mobile safe areas and long numbers: navigation must not obscure content or crop the brand.
- Sign-out and theme changes: private account state clears; all visible surfaces retain contrast.

### Task 1: Freeze reference and validate baseline

**Files:** frozen HTML, spec, this plan, `verification/approved-studio-baseline.log`.
- [x] Preserve the approved HTML and extract its CSS as the design foundation.
- [x] Verify application source matches GitHub main and run `npm test`.

### Task 2: Navigation, shell and settings

**Files:** `components/Shell.tsx`, `lib/navigation.ts`, `components/SettingsSheet.tsx`, `components/Session.tsx`, `app/layout.tsx`, `tests/navigation-restoration.test.mjs`.
**Interfaces:** Navigation memory stores per-route Y offsets and exposes pending targets; Shell owns the persistent document-scroll lifecycle. Settings consumes `useProduct()`.
- [x] Write failing tests for deferred restoration, cancellation and active-tab behavior.
- [x] Implement document-based restoration that waits for content and cancels on user intent.
- [x] Replace the sidebar with approved top navigation/dock and compact settings sheet.
- [x] Run navigation tests; preserve auth gating and account cache isolation.

### Task 3: Research presentation and evidence-based outlook

**Files:** `components/Research.tsx`, `components/DecisionBrief.tsx`, `components/ResearchOverview.tsx`, `lib/outlook.ts`, `tests/outlook.test.mjs`.
**Interfaces:** `researchOutlook(research)` returns typed three-year earnings sensitivities or a reason for withholding them; `DecisionBrief` reads the existing decision engine and exposes a buy/owner context.
- [x] Write failing tests for scenario math, source/currency/staleness guards and absent forecasts.
- [x] Implement the approved research canvas, amount-free DCA, key metrics and compact outcome layout.
- [x] Keep real history/chart period controls and all existing financial/technical/thesis views connected.
- [x] Run outlook and existing research/data regressions.

### Task 4: Workspace and coherent styles

**Files:** `components/Workspace.tsx`, `components/SupportingViews.tsx`, `components/Charts.tsx`, `app/globals.css`, `components/ResearchWorkspace.module.css`.
**Interfaces:** Existing workspace mutations and quote batches remain authoritative. All page views use one approved style foundation and a small compatibility layer.
- [x] Align Home, holdings, saved rows, filters and dialogs with the approved reference.
- [x] Remove duplicate legacy CSS imports and oversized/redundant primary panels.
- [x] Use the actual theme/canvas palette for chart text and series; preserve normal scrolling.
- [x] Run the full suite and TypeScript.

### Task 5: Verify and package

**Files:** `verification/APPROVED_STUDIO_REPORT.md`, `docs/DEPLOYMENT.md`, `START_HERE_AURYN_WORK_INSTRUCTIONS.md`, `MANIFEST.sha256`.
- [x] Run `npm run verify` and `npm run test:api`; inspect failures and repair concrete regressions.
- [x] Review final diff against the spec, validate source inventory and exclude secrets/generated dependencies.
- [x] Record rendered and physical-device verification limits truthfully.
- [x] Deliver one complete ZIP with concise Git/Vercel instructions.

## Execution record

Current source started from main `53655c8`. Baseline 132 tests passed. Final scope includes the user’s explicit follow-up to show only the approved primary metrics. Implemented inline with one fresh independent code review. Two important findings were reproduced and fixed. Final evidence and all verification limits are in `verification/APPROVED_STUDIO_REPORT.md`; unsupported rendered/device acceptance is reported rather than marked as passed.
