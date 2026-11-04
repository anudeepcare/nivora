# AURYN Action and Website Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. User has approved implementation; no additional approval gate.

**Goal:** Deliver shared accumulation decisions, mobile-first polish and website readiness.
**Architecture:** Extend the existing shared decision engine and presentation helpers. Use Next metadata routes and a consent-gated optional analytics client; preserve auth/provider boundaries.
**Tech Stack:** Next 15.5, React 19, TypeScript, existing Node tests.
**Spec:** docs/superpowers/specs/2026-10-27-action-web-design.md

## Global Constraints
Preserve approved design, P branding, raw dates and source truth. No fabricated values, production push or external messages. Default public contact support@auryninvest.com. Native implementation in existing isolated feature checkout.

## Review Focus
- Unknown ownership versus a saved holding: entry and holder actions must not contradict the shared evidence.
- Confirmed P0 with forming P4, and no monthly history: no accidental accelerated instruction or duplicate pending tiles.
- Growing but underfunded companies: growth cannot bypass missing inputs, dilution or financing limits.
- Analytics revocation/route changes: no PII, query values, private ticker path or duplicate page event.
- 360px layouts with long names, help and tables: no page overflow, covered actions or tiny text.

### Task 1: Decision and metrics
Files: lib/auryn-decision.ts, lib/pace-presentation.ts, lib/edge-research.ts, lib/overview-evidence.ts; new lib/growth-assessment.ts; tests/action-web-decision.test.mjs.
Interfaces: fundedGrowthCase(input) => eligibility/checks; aurynDecision returns actions entry/holding and contextLabel; pacePresentation retains rawLevel and returns actionLabel/effectiveCode; metrics add point-in-time/observed labels.
- [x] Write tests for entry/holding/P0, funded and underfunded growth, missing inputs, cash dates and multiple dates; run and observe expected failures.
- [x] Implement shared policy and wording; run focused tests and preserve existing decision regressions.
- [x] Commit with ledger evidence.

### Task 2: App-wide presentation and mobile
Files: components/PaceGuidance.tsx, ApprovedResearch.tsx, ApprovedWorkspace.tsx, SupportingViews.tsx, Discover.tsx, CompanyMetrics.tsx, DecisionWatch.tsx, lib/report.ts, app/action-web.css.
Consumes shared decision and presentation output. Produces one action/Pace display and compact evidence details.
- [x] Add rendered behavior regressions for action-first Pace and one missing-history state.
- [x] Integrate shared guidance, owner context and colorful applicable metrics; preserve full detail and existing alert functions.
- [x] Browser-check mobile and desktop controls, names, modal positioning and help; fix observed layout issues.
- [x] Commit and ledger.

### Task 3: Support, discovery and consent analytics
Files: lib/site.ts, lib/seo.ts, lib/analytics.ts, components/Analytics.tsx, app/robots.ts, app/sitemap.ts, app/opengraph-image.tsx, app/layout.tsx, catch-all metadata, support/public/legal components, app/about/page.tsx, app/pace/page.tsx; tests/site-readiness.test.mjs.
Interfaces: routeMetadata(path) public canonical/noindex; safeAnalyticsEvent(name,parameters) emits allowlisted coarse event; public support constant. Optional GA ID and Search Console verification token via environment.
- [x] Write behavioral tests for canonical metadata, private routes, sitemap, sanitization and consent handling; observe failures.
- [x] Implement metadata/public pages/support default and analytics with explicit choice/revocation, safe events and no added dependency.
- [x] Add deployment activation guide and endpoint audit script; verify real local responses and browser layouts.
- [x] Commit and ledger.

### Task 4: Final verification and delivery
- [x] Run npm test, npm run typecheck, npm run build, npm run test:api and website endpoint checks.
- [x] One fresh whole-branch review, fix important issues with regression cycles; record actual limits.
- [x] Commit and package complete source with manifest; validate archive; replace existing deliverable.

Implementation details: funded-growth helper stays exported from auryn-decision.ts; public metadata/analytics use site-metadata.ts and analytics-policy.ts. One consolidated release commit preserves the full app-wide change after verification. Endpoint checks ran through the managed browser same-origin harness because shell HTTP access to the preview is unavailable; the standalone read-only deployment checker is included. See ACTION_WEB_RELEASE_20261027.md for exact verification and activation scope.
