# Unified AURYN Product Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans, native execution in the current session. Do not dispatch agents or commit/deploy without separate authorization.

**Goal:** Apply the approved research design across the application and replace the production price-only accumulation presentation with a documented trend-adjusted policy and independent model evidence.

**Architecture:** Existing Next/React routes and authentication remain in place. One content-surface stylesheet owns the new visual primitives; existing sheets retain specialized geometry and the installed PWA shell remains last. A pure, memoized monthly policy consumes completed adjusted price history independently of quotes and exposes confirmed/forming readings, dated thresholds and explicit coverage.

**Tech Stack:** Existing Next.js, React, TypeScript, native CSS, Node test runner.

**Spec:** docs/APPROVED_RESEARCH_20261023.md and the user-approved design image docs/design/approved-research-20261023.png, extended by the user's instruction to implement every page and the improved engine.

## Global Constraints

- Keep all real values from the existing adapters; do not use illustrative IREN numbers in production.
- Preserve PWA safe-area, keyboard, scroll memory, quote retention and account ownership.
- No new paid data/AI subscription, order execution, live schema mutation, or deployment.
- DCA multipliers are contribution conditions, not return predictions. Missing evidence is not 0x.
- Published analyst targets, earnings sensitivities and intrinsic valuation must remain distinct.
- Retain useful statements, technical metrics and original policy evaluation without duplicate primary panels.

## Review Focus

- End-of-month after-close and UTC/local-date transitions must not keep a settled signal labelled forming.
- Short IPO histories, bad OHLC, gaps, future bars and duplicate dates must not manufacture signals.
- Quote loss must not erase settled signals or reported financial values.
- Dark mode, large text, narrow controls and keyboard focus must remain readable.
- Cash/margin accounting and date-sensitive provider fixtures must retain their tested contracts.

### Task 1: Production monthly policy
Files: lib/accumulation-policy-v3.ts, lib/analysis.ts, components/AccumulationDesk.tsx, tests/accumulation-v3.test.mjs.
Interface: researchAccumulation(bars, asOf, market) returns version, confirmed, forming, history and coverage/reason. Signals retain multiplier/close/month/drawdown/deviation and add dated trend bands, residual scale and risk context.
- [x] Write and run failing tests: completed-month confirmation, price-scaling invariance, bearish/flat/extreme histories, gaps, no look-ahead and quote independence.
- [x] Implement prior-window robust log-price trend and explicit drawdown gates; preserve v1/v2 evaluation functions unchanged.
- [x] Integrate the same function into the brief and technical desk; no competing production signal.

### Task 2: Historical evaluation
Files: lib/accumulation-evaluation.ts, tests/accumulation-evaluation.test.mjs, components/AccumulationDesk.tsx.
Interface: evaluateAccumulation returns equal-budget baseline and adaptive results, executed only after prior signal dates, with carried cash and bounded costs.
- [x] Write failing tests for no borrowing, equal external deposits, transaction costs and next-observation execution.
- [x] Implement evaluation and labelled results with no performance guarantee.

### Task 3: Shared content design and primary routes
Files: app/product-surfaces.css, app/layout.tsx, components/Workspace.tsx, components/Ui.tsx, components/PortfolioCharts.tsx, components/SupportingViews.tsx.
- [x] Establish one content owner for cards, controls, section headers, tables, status chips and spacing; remove conflicting base-surface declarations from earlier content sheets.
- [x] Redesign Home attention/radar, Watchlist, research discovery, Portfolio accounting/allocation/holdings and Settings using these primitives.
- [x] Preserve every API, mutation, modal and position/account calculation contract.

### Task 4: All research tabs
Files: components/Research.tsx, components/FinancialPicture.tsx, components/ResearchDetails.tsx, components/TechnicalDashboard.tsx, components/AnalystRatings.tsx, components/CompanyUpdates.tsx, components/AdvancedResearch.tsx.
- [x] Use Overview, Business, Financials, Value, Technicals, Analysts, News, Advanced in one responsive tab strip.
- [x] Move company/segment evidence into Business; keep financial statements and funding in Financials.
- [x] Consolidate overlapping earnings/transaction/news sections into one event workflow; keep all supplied metric values.
- [x] Apply the same cards/headers/numeric treatment to every subtab and technical group.

### Task 5: Model suitability and transparent price context
Files: lib/research-brief.ts, lib/model-assessment.ts, components/ResearchOverview.tsx, components/DecisionOverview.tsx, tests/model-assessment.test.mjs.
- [x] Add one model assessment that explains which available model can be used and the exact absent inputs; keep analyst fallback separate.
- [x] Test profitable, loss-making, financial, frontier, foreign-currency and crypto inputs; no fabricated numeric range.
- [x] Show direct route to the applicable model and retain automatic supported scenarios across old/current quote states.

### Task 6: Public/authentication/help and secondary pages
Files: components/PublicLanding.tsx, components/Session.tsx, components/LegalDocument.tsx, components/AlertCenter.tsx, components/Discover.tsx, components/ResearchLab.tsx, components/Trading.tsx.
- [x] Apply shared presentation to storefront, sample, sign-in/signup/recovery, legal/help, alerts and hidden secondary tools; preserve auth methods and execution safeguards.
- [x] Keep login outside workspace navigation; do not expose hidden tools in the primary navigation.

### Task 7: Verification and single source package
- [x] Run full unit tests, type checks, production build and all compiled API checks.
- [x] Browser comparison completed for five companies on three reference sites. Local preview rendering was blocked; physical iPhone and visual acceptance remain unverified and are recorded in the release report.
- [x] Update the coverage report by route, model version, test result and remaining live entitlements.
- [x] Package full source, tests, design reference, model rules and Git/Vercel instructions; validate manifest/archive and replace the existing deliverable identity.
