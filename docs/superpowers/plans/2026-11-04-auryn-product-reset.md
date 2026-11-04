# AURYN Product Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Work natively unless the user authorizes delegation.

**Goal:** Deliver the complete approved AURYN presentation system with preserved financial depth and verified visual fidelity.

**Architecture:** Shared v2 components consume typed adapters over existing models. The local prototype and live application share rendering code. Migrate routes individually, remove their legacy styling dependencies, and retain current server authentication, persistence, and entitlements.

**Tech Stack:** Existing Next 15.5.28, React 19.2.8, TypeScript 5.9.3, CSS Modules, lightweight-charts 5.2.1, lucide-react 0.468.0. No new runtime UI library is required.

**Spec:** `docs/superpowers/specs/2026-11-04-auryn-product-reset.md`

## Global constraints

- Design approval is not production deployment authorization.
- Keep financial calculations and feature access policies unchanged during UI migration.
- Fixtures must remain local-only; rendering components must be identical for fixture and live adapters.
- Normal-text contrast >=4.5:1, meaningful UI boundaries >=3:1, touch targets >=44px.
- Verify 390x844, 768x1024, 1440x900, and 1920x1080 in light and dark themes.
- No undocumented feature deletion; no missing-to-zero conversion; no new branded scores without calculation specifications.
- Commit only scoped changes after checking repository authorization; never sweep existing uncommitted work into a task commit. Do not push/deploy.

## Review focus

- Long company names plus stale/error metadata must not push essential controls outside the viewport (Tasks 2, 5).
- Back navigation after async content arrives must restore meaningful scroll without fighting user gestures (Tasks 2, 11).
- A price changing during rendering must not produce conflicting displayed upside calculations (Tasks 1, 5).
- Missing history, including <200 completed weeks, must remain distinct from zero or a negative reading (Tasks 1, 6).
- Free/expired users must not see empty-looking Pro tools or gain access through preview fixtures (Tasks 8, 11).

## Task 1 — Coverage ledger and presentation contract

**Files:** create `docs/design/coverage.csv`, `lib/presentation/contracts.ts`, `lib/presentation/research.ts`, `tests/presentation-contracts.test.mjs`; inspect `lib/types.ts`, `lib/page-routing.ts`, `components/Product.tsx`, `components/Research.tsx`, `lib/access-policy.ts`.

**Interfaces:** `MetricState = 'available'|'stale'|'missing'|'insufficient-history'|'restricted'|'error'`; `MetricView = { id:string; label:string; value:number|null; unit:string; currency:string|null; period:string|null; asOf:string|null; state:MetricState; explanation:string; sourceUrls:string[] }`. `toResearchView(research: Research, now:number): ResearchView`; define `ResearchView` with company identity, quote snapshot, key metrics, existing Pace presentation, and existing research data reference. Access remains separately provided by the existing access context.

- [ ] Enumerate routes from `productPages`, explicit routes and auth callbacks; trace all render branches and research subviews. Ledger columns: id, source, destination, control/data, gate, persisted_state, fixture, verification, status.
- [ ] Expand every `Metric`/`FinancialPeriod` field and every technical/options/advanced UI field into ledger rows. Mark source-found separately from reachable and live-verified.
- [ ] Write failing tests `missing_is_not_zero`, `stale_preserves_value_and_time`, `quote_snapshot_is_consistent`, `history_shortfall_is_explained` with null/zero/stale/sparse fixtures.
- [ ] Run `node --experimental-strip-types --test tests/presentation-contracts.test.mjs`; confirm failures represent absent adapters.
- [ ] Implement adapters without altering policy or formula modules. All sample values are deterministic fixtures with visible illustrative labels.
- [ ] Rerun tests and review ledger for orphaned features. Save scoped checkpoint.

## Task 2 — Brand, tokens, components and navigation prototype

**Files:** create `public/brand/auryn-wordmark.svg`, `public/brand/auryn-symbol.svg`, `components/v2/tokens.css`, `components/v2/ui/{Button,IconButton,Field,Metric,DataState,Dialog,Table}.tsx`, `components/v2/ui/Controls.module.css`, `components/v2/shell/{WorkspaceShell,PublicShell}.tsx`, `components/v2/shell/Shell.module.css`; inspect `components/Shell.tsx`, `components/Search.tsx`, `lib/navigation.ts`.

**Interfaces:** `WorkspaceShell({activePath:string, children:ReactNode})`; `PublicShell({children:ReactNode})`; `Metric({metric:MetricView})`; `DataState({state:MetricState, message:string, onRetry?:()=>void})`. Button and Field accept native attributes plus an explicit variant; do not invent cross-page class names.

- [ ] Produce logo at 16/24/32/48px and full wordmark; render proposed tokens and all control states on a local specimen page.
- [ ] Implement spec geometry: 208px sidebar, 56px utility header, <768px mobile bottom navigation; Settings and reading templates use explicit maximum widths.
- [ ] Render long labels, error messages, keyboard focus, disabled/loading controls and themes before page composition.
- [ ] Verify one clear button in search, keyboard selection/Escape, cancellation of obsolete results, and no duplicate global/local search.
- [ ] Record viewport checks and keyboard/scroll behavior. Keep old production shell unchanged.

## Task 3 — Local preview route and state fixtures

**Files:** create `components/v2/preview/DesignPreview.tsx`, `tests/fixtures/v2-states.ts`; modify localhost preview branch in `app/[[...route]]/page.tsx` and route allowlist with tests.

**Interfaces:** `DesignPreview({page:string, state:'populated'|'empty'|'loading'|'stale'|'error'|'restricted'})`. Fixtures implement the same view types as live adapters.

- [ ] Add failing route tests that public hosts cannot render v2 preview fixtures, even with the preview flag set.
- [ ] Implement local-only preview under `/preview/redesign`, retaining the existing host and environment guard.
- [ ] Provide screen/state navigation for every ledger destination; entries remain visibly incomplete until actually rendered.
- [ ] Run routing tests; verify fixture values never appear in production API responses.

## Task 4 — Pace instrument and evidence interaction

**Files:** create `components/v2/pace/{PaceInstrument,PaceEvidence}.tsx`, `components/v2/pace/Pace.module.css`; reuse models from `lib/pace-presentation.ts`, `lib/pace-instrument.ts` and the existing policy engine.

**Interfaces:** `PaceInstrument({view, readings, variant:'hero'|'panel'|'inline', onEvidence:()=>void})`; use existing view/readings types, not a new policy representation.

- [ ] Create fixtures for P0–P4, missing, confirmed and forming disagreement, and business qualification missing.
- [ ] Build the five-segment visual with stage labels and diamond marker; remove the olive staircase treatment from the new design.
- [ ] Ensure missing is not P0; P1 is Watch; policy multipliers remain sourced from the engine.
- [ ] Verify compact mobile, desktop panel, public hero and reduced-motion behavior. Evidence interaction must expose date, period and reason.

## Task 5 — Research overview and persistent navigation

**Files:** create `components/v2/research/{ResearchFrame,Overview,MetricStrip}.tsx`, `components/v2/research/Research.module.css`; inspect `components/Research.tsx`, `components/IntegratedResearch.tsx`, `components/useLivePrices.ts`.

**Interfaces:** `ResearchFrame({view:ResearchView, section:ResearchSection, onSection:(section:ResearchSection)=>void, children:ReactNode})`; `ResearchSection = 'overview'|'business'|'valuation'|'technicals'|'analysts'|'options'|'ownership'|'news'|'advanced'`.

- [ ] Define old query-value aliases Snapshot→overview, Financials→business, Thesis→ownership, News→news and identity mappings for remaining tabs. Verify direct links and browser back/forward.
- [ ] Compose header, six metrics, chart and Pace; use one quote snapshot for quote-dependent values.
- [ ] At 1440x900 verify header, tabs, Pace, six metrics and >=320px chart are visible. Repeat with long identity and stale metadata.
- [ ] On mobile verify logical reading order, visible selected section, touch chart inspection and normal document scrolling.

## Task 6 — Technicals, chart tools and financial evidence prototype

**Files:** create `components/v2/research/{Technicals,Business,Valuation,Analysts,Ownership,News,Advanced}.tsx` and corresponding CSS Modules; reuse calculation outputs behind `TechnicalDashboard`, `TechnicalLevels`, `Financials`, `FinancialExplorer`, `ValueStudio`, `AnalystRatings`, `AdvancedResearch`, `CompanyUpdates`, `EarningsWorkspace`.

**Interfaces:** each section consumes `ResearchView` and existing feature access; chart controls expose separate range, interval, and indicator state. No section recalculates business policy.

- [ ] Map every field/control in the ledger to a section fixture before retiring an old render branch.
- [ ] Recompose Trend/Momentum/Volatility/Participation with accessible definitions and all current studies; verify 200-week WMA availability with sufficient and insufficient completed history.
- [ ] Recompose financial periods/statements and model scenarios; display units, source periods and aligned bear/base/bull assumptions.
- [ ] Implement analysts, ownership, news and advanced subviews with populated/error/missing states. Keep detailed data in its primary section.
- [ ] Verify changing chart interval does not change the meaning of daily studies; test dates, anchor selection and reset; preserve chart inspection state across section switches.

## Task 7 — Home, lists, portfolio, discovery and comparison

**Files:** create `components/v2/workspace/{Home,ResearchLibrary,Watchlist,Portfolio,Discover,Compare}.tsx` and corresponding modules; inspect `ApprovedWorkspace.tsx`, `ApprovedWorkspaceForms.tsx`, `PortfolioLedger.tsx`, `HoldingsImport.tsx`, `AccountBalances.tsx`, `Discover.tsx`, `SupportingViews.tsx`.

**Interfaces:** retain `useProduct()` as the live workspace boundary; prototype props expose equivalent workspace data and callbacks without network effects.

- [ ] Build common company rows and compact event/news rows. Eliminate motivational/search hero panels from workspace lists.
- [ ] Make Home prioritize transitions, alerts and upcoming events; link detailed data to its destination.
- [ ] Preserve holding add/edit/delete, ledger, imports, balances, allocation, risk and supported comparison flows. Do not add fictional portfolio performance history.
- [ ] Verify long symbols, negative returns, empty portfolios, 300-item lists, filter/sort state and import errors. Mobile table alternatives must retain all fields through details.

## Task 8 — Settings, alerts and membership

**Files:** create `components/v2/account/{Settings,Alerts,Plans}.tsx` and modules; adapt current appearance/access/billing/alert handlers from `SupportingViews.tsx`, `AppearanceControls.tsx`, `AlertCenter.tsx`, `Plans.tsx`, `Access.tsx`.

**Interfaces:** Settings section IDs `account`, `appearance`, `research`, `notifications`, `security`, `billing`; retain existing persistence keys until a deliberate migration is specified.

- [ ] Build category navigation and compact forms with visible save/error feedback. Appearance respects saved choices and keeps financial colors stable.
- [ ] Display alert transition, time and delivery status; preserve edit/delete actions.
- [ ] Show Free/Pro/expired/loading/error as distinct states. Verify server gates independently of client visibility.
- [ ] Check keyboard, text zoom, reload persistence and failed-save recovery. No irreversible billing operations during preview.

## Task 9 — Public site, authentication and secondary routes

**Files:** create `components/v2/public/{Landing,Auth,Learn,Contact,Legal}.tsx` and modules; adapt `PublicLanding`, `PublicEducation`, `Session`, `PasswordRecovery`, `LegalDocument`, `Contact`; preserve `app/about/page.tsx`, `app/pace/page.tsx`, auth handlers, metadata and route aliases.

**Interfaces:** Public content uses existing legal/content sources; Auth uses existing authenticated session/provider actions. Preview authentication callbacks are inert and labeled.

- [ ] Build banner-first public home around the same Pace component, then proof through actual product views and methodology.
- [ ] Build login/register/recovery and all errors/provider/loading states without workspace chrome.
- [ ] Cover pricing, sample, about, Pace education, contact/help/legal/reliability and owner/admin surfaces from the ledger.
- [ ] Preserve research-lab/trading routes and all supported functions in named Advanced destinations with explicit aliases; do not silently turn them into generic pages.

## Task 10 — Complete visual review before live migration

**Files:** create `docs/design/visual-review.md`; capture deterministic reference images for each route/tab/state.

- [ ] Review every populated screen at all four required viewports; record light/dark, keyboard and state checks. Label each screenshot with route, viewport, fixture and version.
- [ ] Verify all ledger rows have a rendered destination; list remaining unavailable data/incomplete views explicitly.
- [ ] Present the actual interactive prototype and a route coverage summary for visual approval. Do not describe a subset as the complete app.
- [ ] Freeze approved reference captures and component version. Any subsequent layout change is documented against these references.

## Task 11 — Live adapters and isolated route migration

**Files:** modify `components/Product.tsx`, `components/AppSession.tsx`, `components/Research.tsx`, `app/layout.tsx`; connect v2 wrappers to existing services; add interaction/adapter regressions.

- [ ] Route one verified page at a time to the approved components using live adapters. No duplication of approved markup.
- [ ] For each route verify session retention, provider failures, entitlement failures, stale data and retry, persisted inputs, deep links and scroll restoration.
- [ ] Compare fixture-backed screenshots against approved captures at identical sizes; investigate unexplained geometry and typography differences.
- [ ] Remove old route-owned stylesheet imports and selectors only after dependency tracing. Verify remaining routes still work. Stop rather than masking failures with broad overrides.

## Task 12 — Full verification, data audit and delivery

**Files:** update `docs/design/coverage.csv`, `docs/design/visual-review.md`; create `docs/design/release-report.md`; use existing scripts plus a reproducible symbol manifest.

- [ ] Stop local dev server before production checks to avoid `.next` conflicts. Run `npm test`, `npm run typecheck`, `npm run build`, `npm run test:api`; record results and failures accurately.
- [ ] Execute full browser flows for public/auth/workspace/research/Pro/account at target viewports, including standalone PWA safe areas. Unit test counts are not UX evidence.
- [ ] Run a documented 200-symbol audit with snapshot dates, formulas, tolerances, minimum history and external references where available. Report arithmetic accuracy separately from source agreement and model performance. Never infer competitor superiority from agreement checks.
- [ ] Trace CSS reachability and retire compatibility imports only when all supported surfaces have v2 owners and verified behavior.
- [ ] Package the full source, setup, metric/route ledger, references and report as a new ZIP. Exclude actual env files, secrets, node_modules, .next and private raw audit data. Verify ZIP integrity. Do not label unresolved work complete or deploy without authorization.

## Plan self-review

All design sections map to Tasks 1–12. The five review-focus conditions have named checks in Tasks 1/2/5/6/8/11. Types are defined before consumption; existing financial types are reused. Source-found coverage remains a baseline, not live verification. Next executable deliverable is the local visual prototype after the coverage ledger and reusable controls, not another production restyle.
