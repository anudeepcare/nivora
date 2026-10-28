# AURYN Enterprise Best-in-Class Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a budget-safe, auditable AURYN valuation and decision platform with institutional-grade lineage, validation, Pace integration and iOS-first UX without claiming predictive certainty.

**Architecture:** Keep Next.js/Supabase as the product, auth and persistence layer. Add a pure Python valuation core that can run inside the existing worker first, with a FastAPI boundary and versioned REST contract; promote to a separate service only after measured load requires it. Keep the current decision engine and Pace contract intact until the new engine passes shadow-mode gates.

**Tech Stack:** Existing Next.js/React/TypeScript/Supabase; Python 3 with deterministic numerical core; NumPy only where already available; node:test; Python unittest/pytest only if already available; no new paid service or required commercial dependency.

**Spec:** `docs/superpowers/specs/2026-10-28-enterprise-best-in-class-design.md`

## Global Constraints

- No new paid dependency by default.
- Every valid symbol receives a deterministic state: value, range-only, facts-only or refusal.
- Missing, stale or disputed inputs never become fabricated zeroes or generic verdicts.
- 99.9999% is a calculation-integrity/reproducibility target, not a market-forecast accuracy claim.
- Every output carries `traceId`, `modelVersion`, `configHash` and `asOf`.
- Pace remains separate from valuation and keeps P0–P4 business/risk gates.
- No user-facing valuation swap until shadow, backtest, browser and review gates pass.
- No production deployment, paid purchase, live migration or broker action in this implementation pass.
- Strict TypeScript/Python types; no `any`; no network calls inside pure model functions.

## Review Focus

- Point-in-time leakage: a filing must not affect an output before its `filed_at`; test restatements and historical reads in Task 2.
- Capital-structure errors: splits, ADR ratios, options and convertibles must not create thousand-fold values; test the waterfall in Task 3.
- Capex-heavy companies: Meta/Alphabet/Nvidia-like inputs must route by evidence and show normalized reinvestment assumptions; test in Task 4.
- Universal ticker handling: malformed, unsupported, crypto, OTC, shell and missing-data symbols must return explicit states; test in Tasks 2–5.
- Mobile PWA regressions: status bar, safe areas, keyboard sheets, 320px width and dark mode must remain usable; test in Task 7.

## File map

- `services/valuation/engine/` — pure Python normalization, routing, rates, methods, scenarios, gates and audit output.
- `services/valuation/api.py` — bounded FastAPI-compatible REST adapter; no model logic.
- `services/valuation/tests/` — deterministic Python fixtures and property checks.
- `lib/valuation-contract.ts` — TypeScript mirror of the versioned output contract.
- `lib/valuation-adapter.ts` — existing `Research`/`FinancialPeriod` adapter and shadow comparison.
- `lib/valuation-shadow.ts` — feature-flagged stored comparison, never user-facing by default.
- `supabase/migrations/` — append-only point-in-time facts, corporate actions, outputs, overrides and review queue.
- `app/api/valuation/[symbol]/route.ts` — authenticated cached output endpoint.
- `components/ValuationExplain.tsx` — glass-box source, math and audit drawer.
- `components/PortfolioRisk.tsx` — portfolio scenario, concentration and risk presentation.
- `app/mobile-experience.css` — scoped iOS/PWA shell refinement; no legacy stylesheet deletion.
- `tests/valuation-*.test.mjs` — TypeScript route, contract, shadow, UI and API regressions.

### Task 1: Freeze the versioned contract and budget-safe service boundary

**Files:**
- Create: `lib/valuation-contract.ts`
- Create: `services/valuation/engine/types.py`
- Create: `services/valuation/api.py`
- Create: `services/valuation/tests/test_contract.py`
- Test: `tests/valuation-contract.test.mjs`

**Interfaces:**
- `ValuationOutput` includes `symbol`, `asOf`, `status`, `family`, `routeRule`, `methods`, `price`, `cases`, `impliedGrowth`, `deliveredGrowth`, `confidence`, `dataQuality`, `flags`, `refusalReason`, `facts`, `audit`, `traceId`, `modelVersion`, `configHash`.
- Python `value_stock(inputs: ValuationInputs) -> ValuationOutput` is pure and receives `as_of`; it never calls the network or clock.
- REST `POST /v1/valuation` accepts a validated input snapshot and returns the same versioned output.

- [ ] Write failing contract tests for required fields, status enum, trace identity and no non-finite numbers.
- [ ] Run `node --experimental-strip-types --test tests/valuation-contract.test.mjs` and the Python contract test; expect failure before implementation.
- [ ] Implement the shared contract and bounded adapter with explicit 400/422 errors for malformed symbols and inputs.
- [ ] Re-run tests and commit `feat: add versioned valuation contract`.

### Task 2: Add point-in-time observations and reconciliation

**Files:**
- Create: `supabase/migrations/<timestamp>_valuation_observations.sql`
- Create: `services/valuation/engine/normalise.py`
- Create: `services/valuation/engine/lineage.py`
- Create: `services/valuation/tests/test_normalise.py`
- Test: `tests/valuation-database.test.mjs`

**Interfaces:**
- `read_as_of(symbol, metric, period, as_of) -> Observation | None` selects the latest `filed_at <= as_of`.
- `normalise(snapshot, as_of) -> NormalisedInputs` returns TTM, split/currency checks, net cash, dilution, data-quality score, flags and lineage nodes.

- [ ] Test restatements, as-of reads, split adjustment, ADR ratio, TTM recomputation, FCF sign and disputed fields.
- [ ] Apply migrations only to the local test database; no live migration.
- [ ] Implement append-only facts, corporate actions, reconciliation status and source lineage using existing RLS patterns.
- [ ] Run database and Python tests; commit `feat: add point-in-time valuation data layer`.

### Task 3: Implement routing, dynamic rates and capital-structure waterfall

**Files:**
- Create: `services/valuation/engine/config.py`
- Create: `services/valuation/engine/route.py`
- Create: `services/valuation/engine/rates.py`
- Create: `services/valuation/engine/capital_structure.py`
- Create: `services/valuation/tests/test_route_rates_capital.py`

**Interfaces:**
- `route_company(normalised) -> Route(family, rule, fit, flags)` implements ordered rules 1–14 plus small-cap/illiquidity overlays.
- `build_rates(normalised, curve) -> RateInputs` computes duration-aware discount rates with documented point-rate fallback.
- `diluted_shares(capital_structure, price) -> Waterfall` uses treasury-stock treatment for supported options/RSUs/warrants/converts and flags unavailable terms.

- [ ] Test bank, insurer, REIT, shell, distressed, funded growth, cyclical, build-out, profitable growth, mature, crypto, fund and OTC fixtures.
- [ ] Test dynamic peer-beta unlevering/relevering fallback, yield-curve duration mapping, size/distress premiums and degenerate WACC/terminal spread.
- [ ] Implement deterministic routing and waterfall; no ticker-specific exceptions.
- [ ] Run tests and commit `feat: add valuation routing rates and dilution waterfall`.

### Task 4: Implement methods, joint scenarios, reverse DCF and gates

**Files:**
- Create: `services/valuation/engine/methods/dcf.py`
- Create: `services/valuation/engine/methods/excess_return.py`
- Create: `services/valuation/engine/methods/reit.py`
- Create: `services/valuation/engine/methods/funded_growth.py`
- Create: `services/valuation/engine/methods/facts_only.py`
- Create: `services/valuation/engine/methods/cyclical.py`
- Create: `services/valuation/engine/methods/distress.py`
- Create: `services/valuation/engine/methods/cross_check.py`
- Create: `services/valuation/engine/scenarios.py`
- Create: `services/valuation/engine/gates.py`
- Create: `services/valuation/tests/test_methods.py`

**Interfaces:**
- `run_method(route, inputs, rates) -> MethodResult`.
- `build_cases(base_inputs, method_result, volatility) -> Cases` moves growth, margin, discount and terminal assumptions jointly.
- `reverse_growth(inputs, target_price) -> ImpliedGrowth | None` uses a bounded deterministic solver.
- `apply_gates(output) -> GatedOutput` enforces ordering, positivity, distance, range width, small-cap clipping and confidence status.

- [ ] Write fixture tests for Meta/Alphabet/Nvidia-like build-out, ServiceNow-like profitable growth, IREN-like funded growth, HIMS-like growth, bank, REIT, shell, OTC, cyclical, distressed, crypto and degeneracy.
- [ ] Add property tests for ordering, monotonicity, reverse-DCF round trip, net-cash additivity and exact reproducibility.
- [ ] Implement deterministic percentile scenarios first; keep 10,000-draw Monte Carlo optional/shadow until volatility and performance are measured.
- [ ] Run the full Python method suite and commit `feat: add routed valuation methods and gates`.

### Task 5: Orchestrate the engine and connect shadow mode

**Files:**
- Create: `services/valuation/engine/index.py`
- Create: `lib/valuation-adapter.ts`
- Create: `lib/valuation-shadow.ts`
- Create: `tests/valuation-shadow.test.mjs`
- Modify: `lib/auryn-decision.ts` only for non-user-facing shadow hooks.

**Interfaces:**
- `value_stock(snapshot) -> ValuationOutput` orchestrates Tasks 2–4.
- `researchToValuationInput(research) -> InputSnapshot` never invents missing fields.
- `compareShadow(current, candidate) -> ShadowRecord` records differences, lineage and refusal reasons without changing visible decisions.

- [ ] Test adapter currency, dates, missing fields, crypto identity and existing Pace preservation.
- [ ] Run shadow outputs on fixed fixtures and assert no user-facing component reads them.
- [ ] Store local shadow records only; no production subscriber-wide job yet.
- [ ] Commit `feat: connect versioned valuation engine in shadow mode`.

### Task 6: Add backtest, governance, monitoring and portfolio risk

**Files:**
- Create: `services/valuation/validation/metrics.py`
- Create: `services/valuation/validation/backtest.py`
- Create: `services/valuation/portfolio/risk.py`
- Create: `services/valuation/tests/test_validation_risk.py`
- Create: `supabase/migrations/<timestamp>_valuation_outputs_governance.sql`
- Create: `docs/model-cards/valuation-v1.md`

**Interfaces:**
- `evaluate_backtest(point_in_time_outputs, realised_returns) -> ValidationReport` reports coverage, calibration, rank power, decile spread, bias, refusal honesty and family stability by bucket.
- `portfolio_risk(positions, scenario_outputs) -> PortfolioRisk` returns concentration, correlation, VaR/expected shortfall and scenario contribution.
- `monitor_outputs(outputs, prior_window) -> MonitorEvents` emits drift, refusal, rejection and extreme-output events.

- [ ] Test all metrics against hand-computed synthetic data and verify no future leakage.
- [ ] Add model version/config hash, immutable output records, review queue and RBAC-compatible override records.
- [ ] Run the holdout harness only when sufficient historical inputs exist; report unavailable gates rather than inventing pass results.
- [ ] Commit `feat: add validation governance and portfolio risk`.

### Task 7: Build glass-box explanation and institutional API surfaces

**Files:**
- Create: `components/ValuationExplain.tsx`
- Create: `components/PortfolioRisk.tsx`
- Create: `app/api/valuation/[symbol]/route.ts`
- Create: `docs/API_VALUATION.md`
- Test: `tests/valuation-explain.test.mjs`

**Interfaces:**
- `GET /api/valuation/[symbol]` returns the latest stored output and `asOf`; it never runs an unbounded provider fanout on page load.
- Explain surfaces expose source reference, exact field/tag, transformation, reconciliation, method, assumptions, flags and model version.
- Excel-compatible API names are documented as `AURYN(symbol, field)` and `AURYN_SCENARIO(symbol, case, input)`; no commercial add-in distribution yet.

- [ ] Test refusal, stale, disputed, analyst-adjusted and complete outputs in the real component tree.
- [ ] Test API auth, symbol normalization, cache behavior and error states.
- [ ] Keep provider names and raw identifiers out of the primary card while preserving the glass-box drawer.
- [ ] Commit `feat: add valuation explain and API surfaces`.

### Task 8: Rebuild mobile/PWA shell and route UX

**Files:**
- Create: `app/mobile-experience.css`
- Modify: `components/Shell.tsx`, `components/Pwa.tsx`, `app/layout.tsx`, `app/pwa-shell.css`
- Test: `tests/mobile-shell.test.mjs`

- [ ] Add failing markup/style assertions for unified status/header surface, safe-area padding, compact controls, sheet geometry, dock behavior and keyboard state.
- [ ] Implement scoped iOS-style header, floating dock, modal-sheet spacing, theme-color synchronization and no-overflow rules without removing legacy compatibility styles.
- [ ] Verify 320/375/390/430/768/1024/1280/1440 widths, light/dark, reduced motion and installed-PWA behavior where available.
- [ ] Commit `feat: refine mobile PWA shell and navigation`.

### Task 9: Final integration, independent review and packaging

**Files:**
- Modify: `README.md`, `docs/approved-build/ENTERPRISE_ACCEPTANCE_20261027.md`, `verification/`
- Test: existing `npm run verify`, `npm run test:api`, Python test suite and browser acceptance scripts.

- [ ] Run TypeScript, Python, unit, property, database, API, optimized build and route checks.
- [ ] Run browser interaction checks for search, all tabs, Pace, explanation drawers, settings, logout, mobile navigation and error states.
- [ ] Run the fresh independent review against the design and review-focus list.
- [ ] Fix Critical/Important findings and rerun the full evidence suite.
- [ ] Package one complete source ZIP with manifests and an explicit gate report; do not claim production enterprise acceptance where an external gate is unavailable.
- [ ] Commit `chore: record enterprise validation evidence`.

## Execution notes

Implementation must proceed task-by-task with tests before code, small commits and no live deployment. The first visible release remains the existing engine plus Pace until Task 6 validation and Task 9 review authorize a controlled feature-flagged promotion.

