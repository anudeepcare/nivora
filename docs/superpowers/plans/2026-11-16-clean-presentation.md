# Auryn Clean Presentation Implementation Plan

> For agentic workers: use subagent-driven-development or executing-plans task by task. Preserve the existing tested data engine.

**Goal:** Replace fragmented presentation across every user-facing route with one reference-led, responsive system.
**Architecture:** Existing Next15/React19 application and services remain. Introduce scoped presentation primitives, migrate renderer ownership, then remove the old global compatibility dependency.
**Tech Stack:** Next.js, React, TypeScript, CSS Modules, existing chart library. No new paid services.
**Spec:** ../specs/2026-11-16-clean-presentation-design.md

## Global constraints
No production deployment; no fake financial values; no disabling source freshness/risk checks. Existing auth/session/account and mutation semantics remain. Existing saved path/tab IDs remain. No blanket deletion of data/features. All routes migrate; first slice is a proving step, not the deliverable.

## Review focus
- Missing/stale/short history must not become a fake level or populated target.
- Long names/large currency/empty portfolio must fit320px without hiding controls.
- Data-entry state and unsaved edits must survive tab/dialog transitions as intended.
- Authentication and search overlays need focus return and accessible keyboard flow.
- Financial red/green must not be confused with selected navigation states.

## Task1: route contracts and source ownership
- [ ] Inventory Product.tsx router, all standalone app pages and every Research tab. Record renderer, primary purpose, stateful controls and dependencies in a route matrix.
- [ ] Add a route-contract test for each mutation/navigation before changing renderer structure. Keep test fixtures synthetic and labelled.
- [ ] Identify all class names from legacy-panels actually consumed by each renderer; do not infer removal from filename alone.

## Task2: canonical presentation components
- [ ] Create components/presentation/{Frame,PageHeader,Surface,Metric,DataTable,Field,Feedback}.tsx and one owned stylesheet per primitive. Reuse current DetailDialog native modal with its tests.
- [ ] Define clear props for title/actions/content/loading/error and accessible names. No embedded account/provider/model calls in primitives.
- [ ] Test320/390/768/1440 source layout contracts, variable numeric strings, labels and focus behavior. Run typecheck/lint.

## Task3: public/auth shell and complete Research slice
- [ ] Replace PublicLanding layout using supplied two-column reference and actual auth handlers. Explicitly distinguish illustrative chart from live research.
- [ ] Migrate Session, LaunchScreen, Shell and recovery to the same typography/forms/navigation.
- [ ] Recompose IntegratedResearch + PriceStudyChart + PaceInstrument with one style owner; retain actual current/confirmed and absent-history states. Remove their late correction blocks instead of adding another.
- [ ] Test public CTA/auth, research context, charts/levels, every metric detail and modal state. Seek permitted rendered comparison; record blocker if unavailable.

## Task4: full Research migration
- [ ] Migrate Investment case, Financials, Valuation, Technicals, Analysts, News/earnings, Research tools and gated Options. Keep internal IDs stable.
- [ ] Give each metric one main home; use links/detail dialogs for secondary context rather than repeated cards. Preserve all source arrays and meaningful caveats.
- [ ] Keep policy/cadence forms and saving alerts stateful; do not mechanically unmount them into transient dialogs.
- [ ] Run research/unit/API fixtures with missing/stale, long-history, short-history, negative earnings and non-equity cases.

## Task5: full workspace and supporting routes
- [ ] Rebuild Home with brief/holdings/coverage hierarchy; Portfolio with clear performance basis+benchmark; Watchlist as task-first table; Settings as bounded form sections.
- [ ] Migrate discover/compare/alerts/monthly-plan/labs/trading/plans/contact/legal/help/changelog/owner/public education/portfolio-check. Preserve permissions and actual control handlers.
- [ ] Record every action as retained, relocated or intentionally removed with reason; do not silently discard functionality.

## Task6: remove legacy dependence and verify
- [ ] When route matrix shows every legacy class migrated, remove Product compatibility import; delete unused style files only with reference evidence. Keep reduced-motion/transparency safeguards in new foundation.
- [ ] Add test prohibiting imports of legacy-panels and duplicate presentation owners. Run full npm test, lint, format, typecheck, build and controlled API fixtures.
- [ ] Obtain actual screenshot/keyboard/mobile acceptance in permitted browser. If blocked, report exact limitation and withhold production-approved claim.
- [ ] Package root-level source-only ZIP excluding dependencies/build/secrets; integrity-check archive and list exact validated scope.
