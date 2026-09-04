# NIVORA V65 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a coherent, auditable, mobile-first V65 that separates slow thesis from fast market evidence, makes Trading Lab provable, supports equity/crypto/cash portfolios, and consolidates the application onto one production design system.

**Architecture:** Introduce explicit V65 domain contracts for decision provenance, portfolio assets, trading-run audit events and metric presentation. Preserve V64.2 behavior behind characterization tests while migrating consumers to focused V65 modules, then remove superseded code only after reference/build verification.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase, Alpaca Paper, Twelve Data/provider registry, Node tests, CSS.

**Spec:** `docs/superpowers/specs/2026-09-04-nivora-v65-design.md`

## Global Constraints
- Freeze production parameters under a V65 engine version; learning never mutates them in place.
- Missing/unsupported data is never a measured zero.
- Quote movement alone cannot change slow thesis/company quality.
- Every displayed metric has provenance and one consistent info interaction.
- Portfolio supports EQUITY, CRYPTO and CASH.
- Live-money execution remains disabled.
- Mobile-first behavior is required at 320px and above.
- Dead code is deleted only after reference, test, typecheck and production-build verification.

---

### Task 1: Freeze V65 contracts and characterization tests
**Files:** Create `lib/v65/domain.ts`, `lib/v65/provenance.ts`; modify `lib/nivora-version.ts`; test `tests/v65-domain.test.mjs`, `tests/v65-characterization.test.mjs`.

- [ ] Write failing tests for asset types, separate long-term/today/owner actions, and provenance fields `evidenceAsOf`, `lastMeaningfulChangeAt`, `changedBecause`, `previousValue`.
- [ ] Run `node --test tests/v65-domain.test.mjs` and confirm failure.
- [ ] Implement `AssetType`, `DecisionHorizonView`, `MetricProvenance`, `MetricValidationState`, `V65Decision`, `V65PortfolioAsset` and `buildMetricProvenance()`.
- [ ] Add representative characterization fixtures for current decision payloads.
- [ ] Run tests and `npx tsc --noEmit`; commit `feat(v65): freeze domain contracts`.

### Task 2: Split slow thesis from fast market evidence
**Files:** Create `lib/v65/thesis-engine.ts`, `lib/v65/market-engine.ts`, `lib/v65/decision-policy.ts`; modify `lib/nivora-investor.ts`, `lib/nivora-decision-stability.ts`, `lib/nivora-decision-reality.ts`; test `tests/v65-thesis-stability.test.mjs`, `tests/v65-decision-policy.test.mjs`.

- [ ] Write a failing test where only price changes ±10%; Company Quality/Thesis must remain unchanged while Timing/Opportunity may change.
- [ ] Write a failing test where new earnings/guidance evidence changes slow thesis and provenance explains it.
- [ ] Implement `buildSlowThesis()`, `buildFastMarketState()` and `buildV65Decision()`.
- [ ] Preserve explicit vetoes while mapping old evidence into the V65 contract.
- [ ] Run tests/typecheck; commit `feat(v65): separate thesis from market timing`.

### Task 3: Make actions explicit and reachable
**Files:** Create `lib/v65/action-policy.ts`; modify `lib/nivora-buy-calibration.ts`, `lib/nivora-action-triggers.ts`, `lib/nivora-decision-presentation.ts`, `app/api/decision-audit/route.ts`; test `tests/v65-action-policy.test.mjs`, `tests/v65-buy-distribution.test.mjs`.

- [ ] Write table-driven tests covering every long-term/new-money/owner action.
- [ ] Add an invariant proving BUY is reachable for qualifying synthetic evidence without weakening safety gates.
- [ ] Implement `deriveLongTermAction()`, `deriveNewMoneyAction()`, `deriveOwnerAction()` and exact closest-path/unmet-gate output.
- [ ] Report real-market action distributions by archetype and blocker.
- [ ] Run tests/typecheck; commit `feat(v65): make actions explicit and reachable`.

### Task 4: Rebuild valuation scenarios and fallback
**Files:** Create `lib/v65/valuation-router.ts`, `lib/v65/valuation-scenarios.ts`; modify `lib/nivora-valuation-sanity.ts`, `lib/nivora-investor.ts`; test `tests/v65-valuation.test.mjs`.

- [ ] Test supported compounder, unsupported/pre-scale and implausible scenario cases.
- [ ] Implement archetype routing for defensible DCF/multiple/unit-economics/relative frameworks.
- [ ] Produce Bear/Base/Bull assumptions, sensitivities, timestamps and plausibility state where supported.
- [ ] Produce useful `AlternativeValuation` where absolute fair value is unsupported; never serialize unavailable valuation as zero.
- [ ] Run tests/typecheck; commit `feat(v65): add auditable valuation scenarios`.

### Task 5: Standardize metric proof and number integrity
**Files:** Create `lib/v65/format.ts`, `lib/v65/metric-explain.ts`; modify `lib/nivora-format.ts`, `lib/nivora-metric-proof.ts`; test `tests/v65-format.test.mjs`, `tests/v65-metric-explain.test.mjs`.

- [ ] Test `$774,736`, negative P&L, crypto precision, unavailable values, percentages and duplicate `$28–$28` zones.
- [ ] Implement `formatMoney()`, `formatPrice()`, `formatPercent()`, `formatScore()`, `normalizePriceZone()`.
- [ ] Implement explanation payload: definition, calculation summary, inputs, current reason, change reason, evidence time, validation state.
- [ ] Route V65 serialization through these helpers.
- [ ] Run tests/typecheck; commit `feat(v65): standardize metric proof and formatting`.

### Task 6: Create one responsive design system
**Files:** Create `components/v65/MetricCard.tsx`, `MetricInfo.tsx`, `DecisionBadge.tsx`, `SectionHeader.tsx`, `ResponsiveGrid.tsx`, `EvidenceStatus.tsx`, `app/v65.css`; modify `app/layout.tsx`; test `tests/v65-ui-contract.test.mjs`.

- [ ] Write UI contract tests for button semantics, ARIA state and consistent classes.
- [ ] Implement MetricInfo for tap/click/keyboard/Escape/outside-close with mobile sheet behavior.
- [ ] Implement shared cards/badges/grid/section components and one token layer for typography/spacing/radius/control heights/breakpoints.
- [ ] Run tests/typecheck; commit `feat(v65): introduce unified responsive design system`.

### Task 7: Rebuild stock analysis UX
**Files:** Modify `components/StockClient.tsx`, `components/InvestorDecisionHero.tsx`, `app/stock/[symbol]/page.tsx`, `app/api/investment/route.ts`; test `tests/v65-stock-view.test.mjs`.

- [ ] Require separate Long-term, Today/New Money and Existing Owner outputs.
- [ ] Show exact flip conditions instead of vague WAIT/NO ACTION.
- [ ] Render Bear/Base/Bull or alternative valuation rather than an empty valuation panel.
- [ ] Replace all stock-page info icons with shared MetricInfo and expose score provenance/change history.
- [ ] Verify APP/IREN/BE/OSCR fixtures; commit `feat(v65): rebuild investment decision experience`.

### Task 8: Rebuild portfolio for equity, crypto and cash
**Files:** Create `lib/v65/portfolio.ts`; modify `app/portfolio/page.tsx`, `app/api/portfolio/risk/route.ts`, `lib/nivora-portfolio-risk.ts`; test `tests/v65-portfolio.test.mjs`.

- [ ] Test mixed equity/crypto/cash and assert cash is never equity-scored.
- [ ] Replace arbitrary health-floor logic with concentration, diversification/effective positions, liquidity/cash, position risk, scorable thesis quality and action burden.
- [ ] Add asset-type-aware add/edit flow.
- [ ] Add allocation, deployable cash, concentration, strongest/weakest holdings, opportunities and attention views.
- [ ] Run tests/typecheck; commit `feat(v65): support multi-asset portfolio intelligence`.

### Task 9: Make Trading Lab auditable end-to-end
**Files:** Create `lib/v65/trading-audit.ts`; modify `app/api/trading-lab/run-paper/route.ts`, `status/route.ts`, `diagnostics/route.ts`, `lib/nivora-paper-execution.ts`, `lib/nivora-trading-evaluation.ts`, `app/trading-lab/page.tsx`; test `tests/v65-trading-audit.test.mjs`, `tests/v65-paper-path.test.mjs`.

- [ ] Test that CONNECTED does not imply executed/learning and every no-order path has a reason.
- [ ] Persist run heartbeat/start/end/status and per-symbol snapshot/decision/intent/risk/broker/reconciliation events.
- [ ] Expose actual scheduler heartbeat, blockers, broker responses, fills/cancels, open positions and measured realized metrics.
- [ ] Run the safe Alpaca paper self-test and paper-path tests.
- [ ] Commit `feat(v65): make paper execution observable`.

### Task 10: Add champion/challenger validation
**Files:** Create `lib/v65/challenger.ts`, `lib/v65/promotion-gate.ts`; modify `lib/nivora-backtest-replay.ts`, `lib/nivora-backtest-report.ts`, `lib/nivora-calibration-v63.ts`, `app/api/calibration/route.ts`, `app/calibration/page.tsx`; test `tests/v65-no-lookahead.test.mjs`, `tests/v65-promotion-gate.test.mjs`.

- [ ] Assert every replay input timestamp is `<= decisionAt`.
- [ ] Test promotion gates for sample size, untouched OOS performance, drawdown, calibration quality and forward-paper evidence.
- [ ] Keep challenger configuration physically separate from production coefficients.
- [ ] Show backtest, OOS and forward-paper evidence separately.
- [ ] Run tests/typecheck; commit `feat(v65): add controlled champion challenger validation`.

### Task 11: Migrate remaining pages to one UX
**Files:** Modify `app/dashboard/page.tsx`, `app/watchlist/page.tsx`, `app/discover/page.tsx`, `app/alerts/page.tsx`, `app/globals.css`, `components/ScorePill.tsx`; test `tests/v65-design-consistency.test.mjs`.

- [ ] Add a scan test rejecting superseded metric-info/card class families in active files.
- [ ] Migrate remaining pages to V65 components/formatters.
- [ ] Remove duplicated hover-only info behavior and page-local card systems.
- [ ] Verify responsive labels/actions and grids.
- [ ] Run tests/typecheck; commit `refactor(v65): unify application experience`.

### Task 12: Dead-code and stale-file cleanup
**Files:** Create `scripts/v65-dead-code-audit.mjs`, `docs/archive/README.md`; classify/move/delete superseded `README_V*.md` and `V*_RELEASE.md`; modify `README.md`, `.gitignore`; test `tests/v65-dead-code-audit.test.mjs`.

- [ ] Inventory imports/routes/scripts/styles/docs and classify active/orphan/history/test-only.
- [ ] Verify dynamic route references and package scripts before deletion.
- [ ] Archive useful history under `docs/archive`; delete redundant release notes and dead production code.
- [ ] Remove obsolete `.v57*`, `.v61*`, `.v64*` presentation selectors only after all consumers are migrated.
- [ ] Run audit/tests/typecheck; commit `chore(v65): remove legacy and redundant code`.

### Task 13: Mobile/accessibility acceptance
**Files:** Create `scripts/v65-responsive-audit.mjs`; test `tests/v65-responsive-contract.test.mjs`; modify shared V65 CSS/components only for failures.

- [ ] Check overflow-prone fixed widths, minimum tap targets and popover containment.
- [ ] Verify stock, portfolio, Trading Lab, calibration, dashboard and watchlist at 320/375/390/430/768/1024/desktop.
- [ ] Verify keyboard navigation, focus visibility, accessible names and info controls.
- [ ] Fix shared-system causes instead of page hacks.
- [ ] Run tests/typecheck; commit `fix(v65): harden mobile and accessibility`.

### Task 14: Full release verification
**Files:** Create `V65_RELEASE.md`; modify `README.md`; no feature code unless verification exposes a defect.

- [ ] Run project tests plus every `tests/v65-*.test.mjs`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run build`.
- [ ] Run dead-code/design-consistency audits.
- [ ] Run safe Trading Lab diagnostics and separately record broker connectivity, self-test, scheduler heartbeat and real-signal execution proof.
- [ ] Record real BUY/WAIT/SELL distribution without tuning thresholds to force a desired percentage.
- [ ] Verify mixed-asset portfolio and all mobile widths.
- [ ] Write release evidence separating measured metrics from collecting metrics.
- [ ] Commit `release: NIVORA V65 coherence and proof platform`.
