# AURYN Intelligence Upgrade Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Read-only parallel diagnostics may inform tasks; code ownership stays with the primary implementer. A fresh reviewer checks the whole branch before release.

**Goal:** Implement the approved 104-requirement AURYN release with traceable financial evidence, independent decision dimensions and complete product flows.
**Architecture:** Extend the existing Next.js/Supabase application from commit bbdce50b92384acefb3db79978423da92a75e1ea. Pure intelligence modules provide deterministic, versioned outputs consumed by shared server canonical research and client projections. User plans and journals are persisted under ownership-enforced Supabase policies; external data remains source-backed.
**Tech Stack:** Next.js, React, TypeScript, Supabase, existing market providers, Node test runner, existing browser-test infrastructure.
**Spec:** docs/superpowers/specs/2026-10-16-approved-build.md

## Global Constraints
- One final complete source ZIP; no partial releases.
- Current approved premium UX is the baseline.
- Same versioned decision across all consumers; absent data stays absent.
- Alpaca paper only; no new paid services or secret exposure.
- Preserve required workflows, RLS and documented provider budgets (55/min total, 42/min background).
- Mobile widths 320/375/390/430; tablet; desktop 1280/1440/1920.
- Keep implementation and evidence ledger in verification/next-build/progress.md.
- The user's approval explicitly requests execution; do not introduce another routine approval gate.

## Review Focus
1. Technical-only price changes accidentally alter long-term thesis or trigger owner exits.
2. Restated/YTD/mixed-currency/negative-cash-flow financial inputs publish false valuation.
3. Concurrent paper runs or retries duplicate orders or bypass ownership.
4. User scenarios, missing values, stale canonical snapshots or new display quotes are mistaken for current recommendations.
5. Mobile navigation, chart gestures, long metric values and incomplete integrations leave controls unusable.

## Task 1: Baseline and operational diagnostics (A01-A04, J01-J03, O01-O06)
Files: approved spec; verification/next-build/{baseline,route-inventory,requirements,progress,paper-diagnostics,valuation-audit}.json/md; current workflows.
Interfaces: pinned source commit and route inventory feed every later task.
- [x] Recover current GitHub source and isolate feature branch.
- [ ] Run npm ci and npm run test:release; retain logs and classify baseline failures.
- [ ] Generate full route/action inventory and numbered requirement registry.
- [ ] Diagnose deployed integration state read-only; record exact blockers.
- [ ] Commit baseline planning artifacts without secrets.
Expected: clean install, documented baseline results, all 104 IDs represented.

## Task 2: Canonical clocks and evidence gating (B01-B08, M06)
Files: lib/auryn/v931/{decision-kernel,domain}.ts; lib/auryn/v97/{cio-engine,domain}.ts; lib/auryn/v995/autonomous-research.ts; lib/auryn/v935/canonical.ts; tests/intelligence-clocks.test.mjs.
Interfaces: buildInstitutionalDecisionKernel(existing input plus optional horizonEvidence) returns InstitutionalDecision with decisionDimensions, separate horizons and explicit reason codes; preserve existing fields.
- [ ] Add regression tests for good business plus structural break, all fundamentals absent, missing risk, price-only shifts and independent horizons.
- [ ] Run tests and observe intended failures.
- [ ] Separate tactical vetoes from fundamental thesis failure; abstain on insufficient business evidence; expose reasoned dimensions and coverage.
- [ ] Integrate canonical output into every serializer and resolve incompatible historical expectations explicitly.
- [ ] Run focused and release tests; commit.
Expected: no technical-only business downgrade; no missing-evidence bearish vote; stable canonical consumers.

## Task 3: Financial evidence and valuation (C01-C07, E01-E07)
Files: lib/sec-company-evidence.ts; lib/intelligence/{valuation,evidence}.ts; lib/auryn/v99910/fundamental-analyst.ts; lib/research-valuation-workbench.ts; app/api/company/[symbol]/route.ts; tests/intelligence-valuation.test.mjs.
Interfaces: buildValuation(input: ValuationInput): ValuationAssessment; input retains source/period/currency/shares/net-debt; output has method, evidence status, scenarios, assumptions, crosschecks, missing inputs. calculateImpliedGrowth(input): result never changes canonical decisions.
- [ ] Pin exact-period, as-of, mixed-currency, dilution, nonpositive FCF and unsupported-model cases.
- [ ] Extend normalized source facts and conservative method coverage.
- [ ] Implement supported canonical valuation and separate exploratory/implied calculations with validation.
- [ ] Wire company evidence through shared canonical research and research view.
- [ ] Run financial fixtures, sensitivities and release suite; commit.
Expected: reproducible valuations only with required source-backed inputs; unsupported inputs explain missing data.

## Task 4: Thesis, moat, milestones and positioning (D01-D07, I01-I05)
Files: lib/intelligence/{business-models,thesis,events}.ts; app/api/company/[symbol]/route.ts; app/api/institutional/[symbol]/route.ts; components/research/ThesisWorkbench.tsx; tests/intelligence-thesis.test.mjs.
Interfaces: assessBusinessEvidence(input): BusinessAssessment; compareThesis(previous,current): ThesisChange[]; evidence contains reported/management/assumption basis and source date.
- [ ] Test mature vs infrastructure vs satellite evidence, unknown milestones, conflicting statements and no price-derived moat.
- [ ] Add business-specific evidence checklists, sourced thesis and counterarguments, guidance-to-actual reviews and version changes.
- [ ] Correct ownership/insider dating and distinguish transaction types supported by source.
- [ ] Add evidence-oriented UI with legitimate unknown states; commit verified tests.
Expected: no hand-tuned ticker BUYs and no unverified management claim becomes achieved performance.

## Task 5: Technical structure and marker policy (F01-F08)
Files: lib/research-structure.ts; lib/research-structure-presentation.ts; components/research/WeeklyStructure.tsx; components/market/{MarketTimeframeTape,MarketActionMap}.tsx; tests/intelligence-structure.test.mjs.
Interfaces: preserve buildResearchStructure; add explicit custom retracement inputs and first-known setup marker output.
- [ ] Test standard ratios, custom .686, anchors, endpoints, completed bars, unavailable history, no lookahead.
- [ ] Implement decimal labels, anchor visibility, manual overlays and clear signal/availability explanations.
- [ ] Preserve existing chart gesture/range fixes; verify math and presentation; commit.

## Task 6: Plans, DCA and portfolio evidence (G01-G06, H01-H06)
Files: lib/intelligence/{accumulation,portfolio,journal}.ts; app/api/plans/route.ts; app/api/journal/route.ts; supabase/migrations/generated via CLI; components/portfolio/InvestmentPlanner.tsx; app/portfolio/page.tsx; tests/intelligence-accumulation.test.mjs.
Interfaces: evaluateContribution(input): AllocationDecision (0,.5,1,2,4 bounded by available cash, contribution budget and concentration); previewPortfolio(input): before/after exposure; journal records immutable canonical snapshot plus user rationale.
- [ ] Test cash/concentration caps, no valuation, broken thesis, normal DCA budget and deposit-adjusted benchmark.
- [ ] Implement plans/journal storage with strict ownership and validated inputs.
- [ ] Integrate proposal preview, risk scenarios and journal review without silent order submission.
- [ ] Test storage authorization and arithmetic; commit.

## Task 7: Observable and safe paper operations (J01-J08)
Files: lib/server/authorization.ts; app/api/trading-lab/{status,diagnostics,run-now,run-paper}/route.ts; lib/intelligence/paper-operations.ts; app/trading-lab/page.tsx; required workflow; tests/intelligence-paper-operations.test.mjs.
Interfaces: explicit access/data/schedule/broker/eligibility states; idempotent operation key scoped to policy/snapshot/intent.
- [ ] Reproduce confirmed permission/scheduling failures without bypassing admin checks.
- [ ] Implement diagnostics and safe configuration/migration corrections authorized by scope.
- [ ] Verify duplicate prevention, stale prices, limits, reconciliation, pause and run history.
- [ ] Test controlled paper lifecycle only when credential/session prerequisites hold; record live gaps; commit.

## Task 8: Three-depth stock research and explanations (K01-K05, L06-L07)
Files: components/StockClient.tsx; components/research/{DecisionOverview,ResearchDepth,ThesisWorkbench,ValuationWorkbench,AskAuryn}.tsx; lib/intelligence/{presentation,explanations}.ts; app/intelligence-product.css; components/MetricHelp.tsx.
Interfaces: Quick/Research/Advanced read identical canonical snapshot; horizon selector independent; answerEvidenceQuestion(question,snapshot) returns source-linked deterministic response.
- [ ] Test projection consistency and scenario/canonical separation.
- [ ] Wire prior modules into readable decision summary, context, drilldowns and full evidence view.
- [ ] Add grounded questions with existing authorized AI optional, no invented answers.
- [ ] Verify mobile/keyboard/empty/error interactions; commit.

## Task 9: Today, watchlists, comparisons and alerts (L01-L05)
Files: app/dashboard/page.tsx; app/watchlist/page.tsx; app/alerts/page.tsx; app/compare/page.tsx; lib/intelligence/{briefing,comparison,alerts}.ts; components/research/ResearchBriefing.tsx; tests/intelligence-product-flows.test.mjs.
Interfaces: buildBriefing(snapshots,positions,watchReasons); compareResearch(snapshots); evaluateAlerts(previous,current,rules) returns deduplicated events.
- [ ] Test stale evidence, peer mismatch, repeated events and watched conditions.
- [ ] Implement saved watch reasons, comparison views, in-app alert history and settings with ownership.
- [ ] Reuse canonical data/cache and avoid duplicate navigation; commit.

## Task 10: Full application UX and model evaluation (K06-K09, M01-M08)
Files: actual route inventory; shared shell/preferences/help; lib/intelligence/evaluation.ts; scripts/evaluate-intelligence.mjs; tests/intelligence-evaluation.test.mjs; browser journeys.
Interfaces: versioned point-in-time records -> benchmarked walk-forward report with explicit limitations.
- [ ] Test publication-date cutoff, unsupported data, equal cash budgets and immature outcomes.
- [ ] Implement evaluation reports and candidate-observation boundaries.
- [ ] Audit every inventoried route/control; repair errors and responsive regressions.
- [ ] Run complete journey and responsive comparison checks; commit.

## Task 11: Release gate and final artifact (N01-N08)
Files: scripts/verify-intelligence-release.mjs; verification/next-build/RELEASE_REPORT.md; release manifest; deployment docs.
- [ ] Reconcile all 104 requirements with real implementation/test evidence or explicit blockers.
- [ ] Run clean installation/build, automated and browser suites, auth/data isolation checks and supported live integration probes.
- [ ] Obtain fresh whole-branch review and fix material findings with regression tests.
- [ ] Generate one secret-free complete ZIP, verify manifest/CRC, provide actual Git/Vercel commands.
Expected: truthful readiness report and one final artifact only when included work is implemented and verified to the stated limits.

