# AURYN approved product recovery implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. User approved the mockups and explicitly requested implementation on 16 October 2026.

**Goal:** Deliver the approved readable research and investing experience with trustworthy calculations and connected data.
**Architecture:** Preserve the existing canonical engine and server authorization. Correct evidence contracts first, then introduce shared presentation components that consume the same evidence across stock research, workspace and planning. Maintain stable chart instances and explicit partial-data states.
**Tech Stack:** Next.js 15, React, TypeScript, Supabase, lightweight-charts, existing market-data providers.
**Spec:** docs/audits/2026-10-16-product-recovery-audit.md; docs/superpowers/specs/2026-10-16-approved-build.md; docs/design/approved-2026-10-16/*.png.

## Global constraints
- Match the approved light-theme hierarchy, spacing, readable charts, four-item mobile navigation and concise evidence summaries; retain accessible dark mode.
- Preserve all existing requested capabilities; do not populate mock data in the live product.
- No new paid providers, no real-money trading, no weakened server permissions.
- Unknown evidence is not zero, negative evidence, or verified confidence.
- Preserve existing uncommitted work on codex/auryn-intelligence-upgrade. No destructive cleanup or forced remote push.
- User approval to build already supplied; execute directly and ask only for genuinely unavailable external authorization.

## Review focus
- Stale/misaligned or missing benchmark and volume data must not become directional evidence (Task 1).
- A failed optional storage or provider request must not erase valid holdings or appear as successful empty data (Task 2).
- Quote refreshes, theme changes and changing tabs must preserve chart/navigation state (Task 3).
- Concurrent stock and portfolio planners must use equivalent available cash, position and company evidence (Task 4).
- Live broker configuration/roles and ownership cannot be inferred from local fixtures (Task 5).

### Task 1: Correct technical calculations and provider contracts
Files: lib/quant.ts, lib/nivora-technical-engine.ts, lib/auryn/v5/metrics.ts, lib/auryn/v5/technical-patterns.ts, options/context routes; tests/product-recovery-technicals.test.cjs.
Interfaces: computeTechnicalSnapshot(rows, benchRows, benchmark, options?) returns the existing TechnicalSnapshot plus explicit coverage; buildProfessionalMetrics preserves unavailable values.
- [ ] Write and observe failing tests for flat RSI/MFI, zero volume, missing/misaligned benchmark, short 52-week history, Ichimoku displacement, prior-level breakout and missing options values.
- [ ] Correct calculations, add coverage and use consistent calculation variants; fix provider failure/freshness contracts.
- [ ] Run the affected numerical and provider tests; record results.

### Task 2: Reliable evidence and workspace data
Files: app/api/research-workspace/route.ts, app/api/discover/route.ts, lib/auryn/workspace/model.ts, lib/research-financial-assessment.ts, lib/sec-company-evidence.ts, company/context/institutional routes, migrations.
Interfaces: workspace returns independent holdings/watchlist/research storage status; company evidence keeps period, unit, source and availability; unsupported assessments remain explicit.
- [ ] Reproduce missing-storage and provider-partial failures; test factual revenue/cash-flow/history/valuation inputs across supported archetypes.
- [ ] Isolate storage failures, repair discovery access and fill real financial evidence; implement supported model-specific assessments and source-backed scenarios.
- [ ] Verify with representative source fixtures and available read-only real-provider checks. Review migrations without changing roles or creating orders.

### Task 3: Approved research experience and stable interactions
Files: components/StockClient.tsx, components/premium/AurynResearchOverviewV2.tsx, components/research/*, components/PriceChart.tsx, components/AssetLogo.tsx, components/AppShell.tsx, app/research-surfaces.css and shared styles.
Interfaces: existing company/context/options/canonical data adapters feed focused components. Chart is created once per mounted view and updated incrementally.
- [ ] Add behavioral checks for chart state, tab routing, help controls and missing-value rendering.
- [ ] Implement approved overview, business, financials/earnings, valuation, technicals, events/news, ownership, risks and options. Match spacing/color/type and consolidate duplication.
- [ ] Verify mobile/desktop with representative populated and partial states; compare captures to approved boards.

### Task 4: Workspace, portfolio and accumulation
Files: components/ResearchWorkspace.tsx, components/PlanningWorkbench.tsx, lib/auryn/planning/policy.ts, app/portfolio/page.tsx, related styles and workspace routes.
Interfaces: one planning input model combines budget/cadence/cash/holdings and canonical evidence; saved plans do not imply orders.
- [ ] Add tests for automatic policy explanation, portfolio caps, incomplete inputs and equivalent entry points.
- [ ] Build approved Today, Discover, Portfolio and planning interfaces; connect real changes, events and useful comparisons; make planning visible.
- [ ] Verify full discovery → research → plan → saved/portfolio journey and failure recovery.

### Task 5: Operations, release and complete source handoff
Files: paper routes/operations as needed; verification/product-recovery/*; RELEASE_REPORT.md; GIT_AND_VERCEL.md; package scripts.
Interfaces: existing server authorization and paper lifecycle unchanged unless a demonstrated defect requires repair.
- [ ] Verify permissions and readiness without changing account roles or sending orders; record exact external blockers.
- [ ] Run release tests, production build and focused responsive/interaction checks; fix failures introduced by this work.
- [ ] Perform fresh whole-change review under executing-plans; resolve material findings.
- [ ] Package one complete source ZIP with approved references, test evidence, deployment instructions and accurate remaining limitations. Verify archive contents and integrity.
