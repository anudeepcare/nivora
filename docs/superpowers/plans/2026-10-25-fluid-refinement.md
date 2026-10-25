# Fluid Refinement Implementation Plan

> Execute inline with superpowers:executing-plans. User approval already covers implementation.

**Goal:** Implement the approved third all-metrics design consistently across AURYN.
**Architecture:** Retain the existing Next.js app and validated services. Add a pure overview metric presenter; rebuild the overview composition and edit the source-owned styles rather than adding a late override stylesheet. Preserve PWA geometry.
**Tech Stack:** Next.js, React, TypeScript, CSS, Node test, Playwright.
**Spec:** docs/superpowers/specs/2026-10-25-fluid-refinement-design.md

## Global Constraints
- Real evidence only; missing is not zero; no market-beating or competitor parity claim.
- Preserve authentication, Stripe, access rules, refresh, financial accounting and research tools.
- No production deployment, main push or external account writes.

## Review Focus
- Negative/zero/missing financials retain meaning and correct currency.
- Banks/REITs/crypto do not receive inappropriate operating metrics.
- Long names and wide values wrap at 320px; dialogs and keyboard remain usable.
- Dark mode retains readable ink, selected controls and chart captions.
- Scenario models and historical distributions remain distinct with horizons.

### Task 1: Overview evidence model
Files: lib/overview-evidence.ts, tests/overview-evidence.test.mjs.
- [x] Add tests for finite values, negative/zero values, specialist/crypto, and supplied ownership/multiples.
- [x] Run tests red, implement pure metric grouping with help strings and provenance periods; rerun green.

### Task 2: Graphical overview
Files: components/EdgeOverview.tsx, components/OverviewEvidence.tsx, app/edge.css, tests/edge-ui.test.mjs.
- [x] Recompose assessment/Pace and four evidence areas using the existing scenario contract and chart.
- [x] Retain Crosscheck, risk, method, holder context, checkpoints and analyst context without repetitive panels.
- [x] Verify render and data regressions.

### Task 3: Whole-app refinement
Files: app/canvas.css, app/research-studio.css, app/account-studio.css, app/approved-home.css, app/approved-entry.css, app/public-site.css, app/studio-foundation.css.
- [x] Edit source-owned surfaces: neutral backgrounds, readable type, open metric rows, compact headers, coherent buttons/forms/tabs.
- [x] Check all inventory routes/tabs and light/dark mobile variants; fix observed issues.

### Task 4: Verify and deliver
Files: scripts/verify-edge-browser.mjs, scripts/verify-experience-interactions.mjs, docs/FLUID_REFINEMENT_RELEASE.md, verification reports.
- [x] Run unit/type/build/API checks and browser route/tab/interaction checks.
- [x] Independent final review, fix important findings, regenerate full ZIP and preserve deliverable identity.
- [x] Provide preprod steps and honest acceptance limits.
