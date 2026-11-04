# Approved AURYN Mockup Implementation Plan

> **For agentic workers:** Execute the implementation tasks against their scoped briefs; independent owners use the parallel-agents workflow. The root owns integration and final review.

**Goal:** Replace the production presentation with the approved mockup and strengthen ticker-data resilience, while retaining real account and market behavior.

**Architecture:** Keep Next.js, React, Session/useResource and the existing provider/analysis layer. Port the approved markup to focused React components and reuse data-backed specialist components inside contextual sheets. Scope approved CSS to avoid legacy style conflicts.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, existing market providers, node:test.

**Spec:** docs/approved-build/SPEC.md

## Global Constraints
- Approved mockup commit 632e79dd06d0b8844f2c65f08812ad07fbb79bbf is the visual target.
- No real ticker names on the public homepage; primary public/auth actions visible in the first viewport.
- No live-route demo values, fabricated metrics, altered production Pace formula, or security/auth/billing shortcuts.
- Preserve every useful metric and specialist research tool via contextual panels, with real persistence for actions.
- This isolated copy is the only production source edited. Original source and approved mockup remain preserved.

## Review Focus
- Provider outage with valid ticker: useful partial research, provenance, and no misleading zero.
- Class shares, ETFs, ADRs, punctuation and crypto pairs: identity/currency normalization without mismatched prices.
- Strict Mode, rapid ticker navigation and aborted requests: no stale company or cross-account result.
- No account holdings/empty watchlist and zero-valued financial inputs: usable empty states without fake fixtures.
- 360px viewport, short laptop and keyboard zoom: no clipped forms or page-wide horizontal overflow.

### Task 1: Compact public/account experience
Files: components/PublicLanding.tsx, components/Session.tsx (Login only), components/PasswordRecovery.tsx, app/approved-public.css, tests/approved-public.test.mjs.
Interface: existing ProductSession, auth clients and routes stay intact. Root imports CSS.
- [x] Write failing render/behavior expectations for approved public/auth structure and preserved auth actions.
- [x] Port mock-public markup; use bounded first-viewport layout with compact responsive form spacing.
- [x] Run focused tests and report observed results. Root performs browser verification.

### Task 2: Ticker reliability
Files: lib/providers.ts and provider/search dependencies, relevant API routes, tests/ticker-resilience.test.mjs, scripts/test-ticker-resilience.mjs.
Interface: preserve Research/Company/Quote types and authenticated API contracts. No UI edits.
- [x] Reproduce at least one real failure path using controlled provider responses, then add failures for aliases/partial provider errors/cached fallback.
- [x] Correct root causes while respecting provider budgets, correct as-of dates and currencies.
- [x] Run focused data/API tests; report what real live coverage can be verified separately.

### Task 3: Approved Home/Portfolio/Watchlist
Files: components/ApprovedWorkspace.tsx and focused helpers, app/approved-workspace.css, tests/approved-workspace.test.mjs.
Interface: export Overview, Portfolio, Watchlist, ResearchHome; consume useProduct(), useWorkspaceQuotes(), account balances and existing working dialogs/import/portfolio components. Root changes Product.tsx imports.
- [x] Write meaningful new view-model tests for empty, partial and complete quote coverage; preserve existing action semantics.
- [x] Port the approved Home, Portfolio and Watchlist layouts with real data and existing mutation functions.
- [x] Run focused tests and type checks; report to root.

### Task 4: App shell and research view
Files: components/Shell.tsx, components/ApprovedResearch.tsx, components/ApprovedResearchDetails.tsx, lib/approved-research.ts, components/Product.tsx, app/approved-mockup.css, app/product.css, tests/approved-research.test.mjs.
Interface: Research takes {symbol:string}; model takes Research plus relevant position context and produces source-derived factors, metrics and scenarios. All specialist sections retain real data components. Existing auth and useResource lifetimes retained.
- [x] Write failing tests for positive/negative/missing financial evidence and prominent real Pace with no synthetic BUY override.
- [x] Port the exact mockup structure and wire details, charts, alerts, watchlist and view state to working production behavior.
- [x] Replace main tab strip with contextual sheets; preserve deep-link support and all useful metrics.
- [x] Integrate approved workspace/public assets and run the complete suite, type check and build.

### Task 5: Verification, review and handoff
Files: verification/REPORT.json, docs/approved-build/VERIFICATION.md, docs/DEPLOYMENT.md, final ZIP.
- [x] Exercise provider/API regressions and main account/research/workspace interactions.
- [x] Browser-check desktop, 390px and 360px against mockup, including public/auth primary action visibility and dark theme.
- [x] Obtain independent final code review; correct material findings and re-run affected checks.
- [x] Package complete source with manifest, verify ZIP, save final deliverable and state exact live-test limits.
