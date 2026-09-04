# NIVORA V65.15 Product Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a unified readable NIVORA UX, hard quote-integrity protection, and explanatory Portfolio Health without regressing Portfolio Intelligence or Trading Lab safety.

**Architecture:** Keep V65 scoring decisions intact. Centralize presentation tokens and info affordance in shared CSS/components, centralize quote validation at the quote/decision boundary, and derive Portfolio Health explanations from deterministic portfolio facts. Existing Portfolio visual analytics remain the single visualization layer.

**Tech Stack:** Next.js, React, TypeScript, Supabase, NIVORA V65 engine, node:test.

**Spec:** `docs/superpowers/specs/2026-09-04-v6515-product-quality-design.md`

## Global Constraints
- `Qty` everywhere in Portfolio for equities/ETFs/crypto.
- Small visible circled `i`, >=40px effective hit target.
- Mobile body baseline 16px; desktop nav >=14px.
- Never use a rejected quote in price-sensitive decisions.
- Never invent sector, historical return, goal probability, or score improvement.

---

### Task 1: Shared UX system and info affordance
**Files:** Modify `components/v65/MetricInfo.tsx`, `app/globals.css`; Test `tests/v6515-global-ux.test.mjs`.
**Produces:** `.v658InfoButton` circled affordance and shared Analyze/Portfolio/Trading Lab responsive type tokens.
- [ ] Write source-contract tests for visible border/radius, >=40px hit target, mobile 16px baseline, desktop navigation and cross-page selectors.
- [ ] Run test and verify failure on V65.14.
- [ ] Implement shared tokens and MetricInfo markup/CSS.
- [ ] Run test and full UI contract suite.

### Task 2: Quote integrity hard gate
**Files:** Inspect/modify quote normalization and stock API paths under `lib/v65`, `lib/market-data`, `app/api`; create focused helper if needed; Test `tests/v6515-quote-integrity.test.mjs`.
**Produces:** deterministic `assessQuoteIntegrity` / fallback decision that rejects extreme provider gaps and stale quotes.
- [ ] Write failing tests: 82% provider gap is rejected; fresh close-consistent quote passes; stale quote cannot be execution-ready.
- [ ] Run RED.
- [ ] Implement validation at shared quote boundary and propagate status.
- [ ] Ensure Analyze never presents rejected quote as authoritative and Trading Lab blocks it.
- [ ] Run quote + engine/trading tests.

### Task 3: Portfolio Health explanation
**Files:** Modify `lib/v65/portfolio.ts`, `components/portfolio/PortfolioPulse.tsx`; create `components/portfolio/PortfolioHealth.tsx`; Test `tests/v6515-portfolio-health.test.mjs`.
**Produces:** deterministic health breakdown with strengths, drags, improvement levers and goal framing.
- [ ] Write failing tests for explanation structure and no fabricated score-gain promises.
- [ ] Run RED.
- [ ] Derive health drivers from concentration/diversification/cash/company evidence already available.
- [ ] Build compact Health UI: Why this score / Holding it back / Improve portfolio / Goal fit.
- [ ] Run tests.

### Task 4: Preserve meaningful Portfolio Intelligence
**Files:** Modify only as needed `PortfolioVisualAnalytics.tsx`, `PortfolioXRay.tsx`, `PortfolioBrief.tsx`, `app/portfolio/page.tsx`; Test `tests/v6515-portfolio-master.test.mjs`.
**Produces:** one holdings surface; Qty; Performance/Drivers/Allocation/Risk; Sector/Theme/Asset/Risk/Correlation; SPY/QQQ when reliable.
- [ ] Write regression tests before edits.
- [ ] Run RED for any missing contract.
- [ ] Remove only duplicate/junk output; keep meaningful charts and decision copy.
- [ ] Run tests.

### Task 5: Cross-app responsive polish
**Files:** `app/globals.css` and shared shell/navigation components only where needed; Test `tests/v6515-responsive-system.test.mjs`.
**Produces:** consistent page titles, section headings, metric labels/values, body copy, buttons/tabs, card radius/gutters and glass mobile controls across all three core surfaces.
- [ ] Write failing consistency tests.
- [ ] Run RED.
- [ ] Implement responsive system without page-specific contradictory font overrides.
- [ ] Run tests.

### Task 6: Verification and release
**Files:** `V65_15_RELEASE.md`, package scripts if needed.
- [ ] Run `npm run test:engine`.
- [ ] Run engine TypeScript compile.
- [ ] Run Next production build if dependencies in uploaded baseline permit it.
- [ ] Package source excluding node_modules/.next/.git.
- [ ] Verify ZIP integrity and report any unverified production-build limitation explicitly.
