# Approved planning, portfolio and replay scope — 2026-10-16

## Implemented surfaces

- `components/PlanningWorkbench.tsx` exports a reusable planning UI. Portfolio Overview/Allocation mounts it inside a disclosure with a holding selector. Stock integration is owned by the root implementer.
- The portfolio mount uses `authenticatedPlanningJournalStore` from the workspace implementation. It never silently falls back to local storage when authenticated storage fails. The authenticated schema must be migrated before account saves work. Generic mounts explicitly distinguish authenticated storage, owner-scoped local-only storage and temporary session memory.
- The positive, valid equity preview offers **Review in Paper Lab**, carrying symbol, cash amount, evidence snapshot ID and policy version. The manual Lab consumes the context for review and independently verifies eligibility. This work places no orders.

| IDs | Implemented behavior | Boundaries |
| --- | --- | --- |
| G01–G03 | Explicit user contribution defines 1x; pause/0.5x/1x/2x/4x policies. Thesis, evidence availability/publication time, valuation, funding and concentration gates. Separate recurring and tactical policies. | Versioned experimental policy thresholds; personal inputs are clearly separate from canonical research. No investment-performance validation. |
| G04 | Editable contribution, cadence, budget, allocation cap, review date, pause toggle and written pause conditions; purchase preview and Paper Lab review handoff. | Cadence/settings persist in the immutable journal plan. No automatic scheduling; custom pause text is a review reminder, not an event monitor. Paper eligibility is freshly verified in the Lab. |
| G05–G06 | Equal-capital fixed-DCA comparison with identical cash availability, fees, adverse slippage and exposure caps; idle cash, profit, unitized return/drawdown and turnover. | Imported/prop-supplied historical data only; no fabricated dataset or outperformance claim. Fractional shares assumed. |
| H01 | Existing holdings research links, filters and arithmetic were regression-tested. Fixed boolean/null numeric coercion and incomplete-cost coverage disclosure. Portfolio aggregate position sizing includes duplicate lots. | No authenticated CRUD execution against a live deployment. Existing holdings are position snapshots, not a realized-profit or corporate-action ledger; this limitation is visible. |
| H02–H03 | Asset/sector/theme/shared-risk concentration; classification coverage and missing values; before/after cash, position, total and percentage exposure; costs reconcile. | Sector/theme/risk classification depends on supplied metadata. No guessed classifications, fund look-through or return correlation. |
| H04 | Explicit uniform stress assumption per invested asset, cash held flat, no invented probability; manual opening/closing/deposit/withdrawal gain attribution. | Cash-flow-adjusted return rate is withheld without dated valuation/flow history. Fixed DCA is the supported strategy benchmark; broad market/sector benchmarks are not supplied. |
| H05–H06 | Original thesis, horizon, evidence, timestamps, settings and preview are frozen; later reviews append and reference the original. Checklist completeness is separate from outcome. Export preserves original records. | Authenticated enforcement/migration belongs to the workspace server/RLS implementation. Local-only fallback modes are explicitly not tamper-proof. Checklist score is not outcome probability. |
| M02–M05 | Point-in-time candidate-versus-fixed-DCA evaluator; strict earlier-signal execution; chronological nonoverlapping walk-forward windows; optional last holdout; observation-only output; coverage, abstention, sample count, return, drawdown, costs and turnover; JSON export includes the raw dataset, window declarations and report. | Infrastructure, not a completed empirical model validation. No real unseen-period dataset was supplied. No candidate selection/tuning/promotion, calibration, automatic policy learning, or audited training provenance. Survivorship/selection bias remains unresolved without a point-in-time universe and delisted assets. |

## Verification evidence

Observed RED before implementation:

- 17 initial allocation/portfolio/replay/journal/arithmetic tests failed because the new behavior was missing or the existing numeric-coercion bug was present.
- Three rendering tests failed because the workbench was missing.
- The incomplete-cost-coverage regression failed before its fix.
- Paper handoff, malformed evidence state and future-journal-evidence regressions failed before their implementations/fixes.

Latest scoped command:

```sh
node --test tests/approved-planning.test.mjs tests/approved-planning-ui.test.mjs tests/portfolio-holdings-view.test.mjs
```

Result: **32 passed, 0 failed**. Covers hand-calculated allocation caps/cash/costs, fixed-budget replay, same-close look-ahead exclusion, future evidence, flow-neutral drawdown, retained original snapshots, navigation, missing/foreign prices and partial cost coverage.

Isolated strict compile passed for all four planning modules (separate `.engine-planning` output, moved out of the repository after verification). Full application `tsc --noEmit --incremental false` passed during integration. The root implementer owns the final complete release test/build and responsive browser verification; its normal runner owns `.engine-test`, which this task did not modify.

No source-backed historical investment-performance study, live broker lifecycle, live database migration, authenticated browser save cycle, or responsive screenshot validation was performed by this task. Correct software calculations and rendered labels must not be reported as validated investment performance.

## Owned files

- `app/portfolio/page.tsx`
- `components/portfolio/valuation.ts`
- `components/PlanningWorkbench.tsx`
- `components/PlanningWorkbench.module.css`
- `lib/auryn/planning/policy.ts`
- `lib/auryn/planning/portfolio.ts`
- `lib/auryn/planning/replay.ts`
- `lib/auryn/planning/journal.ts`
- `tests/approved-planning.test.mjs`
- `tests/approved-planning-ui.test.mjs`
- `verification/approved-planning-report.md`

No commits were created. No canonical kernel/autonomous engine, StockClient, paper route, global style, shared TypeScript config, test manifest or shared migration was edited by this task.
