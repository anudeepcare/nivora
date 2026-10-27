# AURYN Pace Zone Contract Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans. The existing build authorization applies; execute inline and obtain one fresh final review.

**Goal:** Restore distinct accumulation decisions and coherent Home/Research presentation.
**Architecture:** Preserve monthly-v5 price calculation; centralize opportunity labels over the shared decision engine. Separate reported earnings in the Home selector. Reuse existing presentation and evaluation components.
**Tech Stack:** Next.js, React, TypeScript, node:test.
**Spec:** docs/superpowers/specs/2026-10-27-pace-zone-contract.md

## Global Constraints
Preserve approved layout, data integrity, confirmed/forming identity and all business-risk overrides. No new dependencies, no fabricated values, no performance guarantees, no production deployment.

## Review Focus
- P1 with attractive valuation must remain Watch/Hold; missing Pace must not fabricate a zone.
- A forming P4 must not upgrade confirmed P1 or override business distress.
- Public descriptions and historical simulations must not claim the old literal multipliers implement the new zone contract.
- Reported and scheduled earnings on the same day must remain separate and correctly counted.
- Dense desktop/mobile drawers must remain usable without expanding hidden panels or clipping controls.

### Task 1: Shared decision and presentation
**Files:** lib/auryn-decision.ts, lib/pace-presentation.ts, components/PaceHelp.tsx, components/ApprovedResearch.tsx, public/help surfaces, tests/pace-zone-contract.test.mjs, tests/business-led-pace.test.mjs.
**Interfaces:** assessDecision retains action/code; adds Watch and zone code. pacePresentation retains shape and returns tier-specific labels. aurynDecision exposes shared action labels alongside raw actions.
- [ ] Test P0 Wait/Hold, P1 Watch/Hold, P2–P4 Buy/Add; risk and malformed inputs; assert generated history has confirmed P2 and forming P4.
- [ ] Run node --experimental-strip-types --test tests/pace-zone-contract.test.mjs. Expected: contract failures before implementation.
- [ ] Implement shared contract and replace literal contribution claims throughout current product surfaces.
- [ ] Run focused tests then npm test. Expected: all pass after updating superseded contract assertions, never weakening unrelated tests.
- [ ] Commit.

### Task 2: Home and visual refinement
**Files:** lib/home-brief.ts, components/ApprovedWorkspace.tsx, components/CompanySparkline.tsx, app/action-web.css, app/product-refinement.css, Home tests.
**Interfaces:** homeBrief adds reported results; checkpoints and earnings represent upcoming only. Shared Pace labels consumed from Task 1.
- [ ] Test that reported SOFI moves out of upcoming while pending same-day companies remain; all-reported day does not keep an upcoming hero.
- [ ] Run Home tests. Expected: new tests fail, then pass after selection/rendering changes.
- [ ] Remove redundant action prose and unloaded-history placeholder; clarify watchlist count and compact drawer geometry.
- [ ] Verify desktop and mobile rendered screens; run npm test and typecheck. Expected: passing tests, no horizontal overflow.
- [ ] Commit.

### Task 3: Evidence and delivery
**Files:** evaluation tests, validation report, release notes, source manifest.
**Interfaces:** frozen policy and new zone contract remain separately versioned; historical evaluation must identify which is tested.
- [ ] Run mechanical evaluation and audit current data/threshold fingerprints. Assess available historical price evidence with equal funding/costs; document omissions and performance, including losses.
- [ ] Run npm test, npm run typecheck, npm run build, npm run test:api sequentially where build artifacts are shared. Expected: all pass.
- [ ] Obtain fresh review of this change range, fix important findings with regression tests, package the complete source ZIP and replace the existing Library deliverable.
