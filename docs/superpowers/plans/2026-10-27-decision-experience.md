# AURYN Decision Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Deliver the approved decision-led mobile/desktop AURYN experience with corrected calculations and resilient coverage.

**Architecture:** Retain Next.js and current integrations. Pure analysis helpers generate consistent output; independent provider resources retain provenance and failure states. Bounded parallel work uses disjoint files, followed by integrated checks and review.

**Tech Stack:** Next.js 15, React 19, TypeScript, Node test runner, existing EODHD/Twelve Data/SEC adapters.

**Spec:** docs/superpowers/specs/2026-10-27-decision-experience-design.md

## Global Constraints

- Deliver one complete source ZIP; no deployment or provider purchase.
- Preserve user data and working functionality.
- No invented observations, performance claims, or bearish interpretation of missing data.
- Company → decision → reasons → Pace → deeper research.
- Mobile safe areas, legible typography, semantic colors, correct Back and immediate Sign out.

## Review Focus

- A stale PWA reopened tomorrow must not call yesterday's price today's move.
- Equal-end reporting periods and parallel currencies must be deterministic and never mix units.
- Price-only or newly listed securities remain usable without an invented investment decision.
- Two companies with earnings on one date must both remain visible.
- International suffixes must not collide with US share-class aliases or USD portfolio arithmetic.

### Task 1: Financial normalization and reconciliation
**Files:** lib/engine.ts, lib/analysis.ts, lib/research-depth.ts, lib/research-brief.ts, lib/outlook.ts; tests/financial-normalization.test.mjs.
**Interfaces:** Preserve exported types; add pure helpers where needed. Consumers continue using Research and its analysis.
- [x] Add failing tests for tied-end period ordering, currency-separated TTM, and dated capitalization reconciliation.
- [x] Implement deterministic comparable period selection and narrowly scoped reconciliation.
- [x] Verify focused tests and document metric definitions/provenance.

### Task 2: Provider coverage and partial recovery
**Files:** lib/providers.ts, lib/provider-symbol.ts, lib/eodhd.ts and related adapters; scripts/audit-market-coverage.mjs; tests/market-coverage.test.mjs.
**Interfaces:** Preserve research(symbol), quote(symbol), marketHistory(symbol), searchSymbols interface; coordinate any new helper contracts before changes.
- [x] Add failing coverage/fallback/alias tests including international conflicts.
- [x] Implement identity-safe lookup and completeness-aware fundamental fallback, per-feature status, directory/coverage audit.
- [x] Run provider routing and coverage tests; document exact enabled universe and credential-dependent coverage checks.

### Task 3: Pace and price-time integrity
**Files:** lib/accumulation-policy-v5.ts, lib/movement-context.ts, components/MovementContext.tsx, app/movement-context.css; tests/accumulation-v5.test.mjs, tests/movement-context.test.mjs.
**Interfaces:** Preserve policy result; movement context accepts explicit wall-clock input for deterministic tests and live UI refresh.
- [x] Reproduce old-history gap and stale movement bugs with tests.
- [x] Fix required trailing-month window; compact movement disclosure and accurate as-of times.
- [x] Run evaluation fixtures; record empirical results and limitations without tuning to validation outcomes.

### Task 4: Shared decision and Research layout
**Files:** lib/edge-research.ts, lib/approved-research.ts, lib/auryn-decision.ts, components/ApprovedResearch.tsx, components/BusinessHistory.tsx, app/decision-experience.css; tests/auryn-decision.test.mjs.
**Interfaces:** aurynDecision(Research, { ownsPosition?, now? }) returns action, tone, headline, reasons, risks, horizon, changeConditions, reference and evidence status. Existing approvedResearch incorporates this record.
- [x] Test ownership independence, horizon normalization, severe risk, missing optional estimates and coherent reasons.
- [x] Implement deterministic decision record with appropriate scenario/risk applicability.
- [x] Reorder Research with compact decision, prominent Pace, small movement strip, expandable evidence and semantic colors.
- [x] Verify formulas and integrated Research routes.

### Task 5: Authenticated shell, Home and Settings
**Files:** components/Shell.tsx, components/ApprovedWorkspace.tsx, components/SupportingViews.tsx, lib/home-brief.ts, lib/home-feed.ts, app/api/home-feed/route.ts, app/workspace-experience.css.
**Interfaces:** Preserve Session/portfolio state and existing route contracts; new CSS imported by root integrator.
- [x] Reproduce conflicting earnings status and truncated feed coverage.
- [x] Implement four-destination mobile navigation, aligned header, compact Settings, grouped events and all-symbol batching.
- [x] Verify Home, account actions, navigation preservation, mobile safe areas and dark mode.

### Task 6: Public and authentication experience
**Files:** components/PublicLanding.tsx, auth components/routes as inspected, app/public-experience.css.
**Interfaces:** Preserve registration/login/reset actions, real pricing and auth redirects.
- [x] Rebuild responsive first-viewport benefit/action with truthful product illustration and Pace prominence.
- [x] Harmonize public/auth typography, spacing and mobile controls.
- [x] Verify all public and auth routes and links.

### Task 7: Integrated verification and delivery
**Files:** docs/approved-build/METRIC_REGISTER_20261027.md, docs/approved-build/RELEASE_20261027.md, verification/decision-experience-20261027.json, scripts/package-source.py.
- [x] Run npm test, npm run typecheck and npm run build; fix material failures.
- [x] Browser-check desktop/mobile, disclosures, search, navigation, authentication forms and representative Research states.
- [x] Obtain fresh whole-change review and resolve material findings.
- [x] Package directly in /tmp, independently verify ZIP CRC/manifest/SHA, then save one full source ZIP.

Execution record: see `docs/approved-build/RELEASE_VALIDATION_20261027.md` and `verification/decision-experience-20261027.json`. Checks are scoped there; live accounts/full-universe statements and investment outperformance are not claimed.
