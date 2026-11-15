# Loading Refinement Implementation Plan

**Goal:** Remove unused research-engine code from the common entry chunk and request the selected portfolio benchmark before unrelated histories.

**Architecture:** Preserve current components and calculations. Lazy-load the public interactive Pace guide only when selected. Reorder the existing sequential portfolio history queue without changing request counts, budgets, authorization or partial rendering.

**Tech Stack:** Next 15, React 19, TypeScript, Node test runner.

**Spec:** Read-only speed audit of the November 14 source candidate and parent-authorized November 15 UX refinement.

## Constraints
- No deployment, paid services, decision formula changes or provider budget changes.
- Preserve existing stage interactions, partial portfolio history and missing-data retry.
- All edits stay in this source candidate.

## Review focus
- Public Business and Valuation guide views must not evaluate the Pace engine.
- Pace guide must retain keyboard/click navigation and accessible labels.
- Selected benchmark should request first, once, with no duplicate when held.
- Switching benchmarks during a holding request must retain shared data.
- Authorization/rate-limit errors must stop the sequential queue; ordinary unavailable history must not discard other usable series.

## Tasks
- [x] Add a failing module-loading regression for PublicLanding; make PaceInstrument a dynamic import; rerun public interaction and loading tests.
- [x] Add failing benchmark-first and single-pending-request assertions to the portfolio loading harness; reorder selected symbols; run switching, failure and partial-series checks.
- [x] Run focused tests, 1,484 full tests, typecheck and production build in an isolated performance-only copy. Compare emitted bundle bytes to the saved unmodified candidate baseline. Combined-candidate acceptance belongs to the final integration run.
