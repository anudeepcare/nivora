# AURYN UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Restore useful visible information, remove repeated presentation and make each price range's source unmistakable.

**Architecture:** Keep the existing React components, data contracts and decision engines. Recompose the screens and use scoped styles rather than replacing calculations or introducing another UI system. Work in an isolated source copy, not production.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS modules, existing Node test runner.

**Spec:** The user's eight November 14 screenshots, request to clean up each screen, and repository AGENTS.md design requirements. User delegated the design choice and requested implementation rather than further questions.

## Global Constraints
- No production deployment, purchases, paid services or data-provider changes.
- Preserve research metrics, provenance, individual help, all scenario methods and their numerical calculations.
- Preserve useful tinted cards/grids, restrained gradients and the branded Pace/chart composition.
- A rendered hidden element is not proof that a metric is visible.
- Distinguish analyst targets, conditional scenarios and historical price risk.

## Review Focus
- Missing analyst bounds must not create an invented range or hide a valid consensus-only observation.
- Missing model inputs must remain unavailable, not zero; all three supported cases remain together.
- Research metrics must have no closed disclosure ancestor.
- Mobile content must remain in logical reading order with touch-sized controls and no empty forced grid tracks.
- Usable portfolio series and dated coverage must survive partial loading and benchmark failure.

### Task 1: Restore overview visibility
- [x] Add a failing rendered-visibility regression for the eight-cell and four-category research grids.
- [x] Expose those grids; move risks into a visible compact list; group secondary methodology without stacking empty full-width controls.
- [x] Keep Pace/chart, all three cases, the concise read and provenance intact. Verify targeted tests.

### Task 2: Remove misleading range duplication
- [x] Add failing rendering tests for source-specific analyst labels and nonduplicated Valuation composition.
- [x] Name analyst values low/consensus/high; reserve bear/base/bull for modeled cases. Render a complete analyst range once in Valuation.
- [x] Clarify conditional scenario headings and remove the inaccurate unconditional three-year horizon label; retain editable P/E and full methods.
- [x] Verify full, partial, equal and unavailable range cases with existing tests.

### Task 3: Improve Home and Portfolio scanability
- [x] Add structural ordering tests for company cards before the optional comparison workbench.
- [x] Replace the comparison promotion with a compact useful tool row and put companies ahead of it. Keep all comparison controls and calculations.
- [x] Coordinate events/news in one desktop grid, keep holdings and all content accessible, reduce unnecessary heading space.
- [x] Simplify Portfolio summary presentation without losing balances/coverage, retain full-width holdings and current partial-load behavior.

### Task 4: Verify and package
- [x] Run focused regression tests, complete test suite, lint, format check, typecheck, build and controlled API suite.
- [x] Obtain independent code review of changed presentation and boundary cases.
- [ ] After-change browser acceptance remains blocked: the new local preview attempt returned ERR_BLOCKED_BY_CLIENT. The limitation is documented; preprod is before-change evidence only.
- [x] Produce a clean ZIP excluding dependencies, build outputs, credentials, logs and browser captures, with exact release scope and checks.
