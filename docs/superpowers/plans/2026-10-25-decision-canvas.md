# AURYN Decision Canvas Implementation Plan

> For agentic workers: use superpowers:executing-plans for implementation and one independent final review.

Goal: implement the approved readable decision-led AURYN experience in actual source.
Architecture: retain validated data engines and session shell; add shared interpretation contracts and scoped component styling. Replace obsolete Overview presentation and edit source components rather than pile global overrides.
Tech Stack: Next15 React19 TypeScript native node tests Playwright.
Spec: docs/DECISION_CANVAS_SPEC.md

## Global Constraints
Follow every constraint in the spec. No production mutation, fabricated values or changed data entitlements. Preserve useful features and shell geometry.

## Review Focus
- Financial conflicts must not mutate price-only signals.
- Partial business evidence must not turn into fabricated valuation or universal Wait.
- Home no-holdings must remain useful and contain no fake holdings.
- Dark mobile controls, long values, keyboard and safe area must remain usable.
- Auth routes and contact must preserve privacy and real flows.

### Task 1 Decision contract
Files lib/auryn-edge.ts lib/edge-research.ts tests/auryn-edge.test.mjs tests/decision-canvas.test.mjs.
- [x] Write failing independent Pace and ownership/partial evidence tests; observe RED.
- [x] Separate risk from confirmed signal; expose company-specific context; observe GREEN.
### Task 2 Overview and common design
Files components/EdgeOverview.tsx app/edge.css app/canvas.css app/layout.tsx tests/edge-ui.test.mjs.
- [x] Write render assertions for Pace distinction and evidence-first UI; observe RED.
- [x] Implement shared calm design and full decision composition; observe GREEN.
### Task 3 Public account support
Files components/PublicLanding.tsx components/Session.tsx components/Contact.tsx lib/legal-content.ts app/approved-entry.css.
- [x] Add meaningful privacy/flow render tests; observe RED.
- [x] Refine public/auth, remove email prefill, simplify help and support; observe GREEN.
### Task 4 Adaptive Home
Files components/HomeBriefing.tsx app/approved-home.css lib/home-presentation.ts tests/home-presentation.test.mjs.
- [x] Test first-use/watchlist/holdings rules; observe RED.
- [x] Preserve populated content, improve relevance, implement distinct first-use; observe GREEN.
### Task 5 Every research tab and shared surfaces
Files components/Research.tsx components/ResearchDetails.tsx components/ValueStudio.tsx components/ResearchPreferences.tsx components/StockFacts.tsx app/canvas.css tests/canvas-surfaces.test.mjs.
- [x] Add interpretation/render tests for metrics and depth.
- [x] Apply shared controls/typography and tab questions, professional detail and specific partial states without deletions.
### Task 6 Acceptance and full delivery
Files scripts/verify-edge-browser.mjs verification/REPORT.json docs/DECISION_CANVAS_RELEASE.md docs/PREPROD_EDGE_DEPLOYMENT.md.
- [x] Run unit tests, typecheck, production build, API checks and responsive browser audit; inspect images.
- [x] Independent final code review; fix important defects with regression tests.
- [x] Package full source, integrity-check archive, save final ZIP and report accurate limitations.

Implementation scope and remaining live-device/provider checks are recorded in docs/DECISION_CANVAS_RELEASE.md.
