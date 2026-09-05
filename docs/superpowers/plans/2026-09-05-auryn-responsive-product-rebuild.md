# AURYN Responsive Product Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace AURYN's overlapping legacy presentation layers with one premium, responsive product system across authentication, Research, Stock Analysis, Portfolio, Monitor, and Trading Lab without changing the investment engine.

**Architecture:** Preserve data/engine/auth/Supabase contracts while rebuilding the active presentation layer around a new scoped design system and responsive shell. Migrate each surface away from legacy selectors, split the stock UI into focused presentation components, and remove active dependencies on V65/NIVORA layout CSS.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Supabase, Lucide, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-05-auryn-responsive-product-rebuild-design.md`

## Global Constraints
- Preserve investment scoring, provider, Supabase, calibration, portfolio calculation, and Alpaca Paper behavior.
- No live-money trading.
- One active responsive/design system on rebuilt pages.
- No page-level horizontal overflow at 360, 390, 430, 768, 1024, 1440, or 1728 CSS px.
- Mobile bottom navigation must never cover content.
- Avoid `!important` as a migration strategy.
- Gold/ivory/black AURYN identity remains restrained and readable.
- Desktop and mobile may use different composition while sharing data contracts.

---

### Task 1: Lock the new presentation contract with tests

**Files:**
- Create: `tests/auryn-v3-product-shell.test.mjs`
- Create: `tests/auryn-v3-auth-research.test.mjs`
- Create: `tests/auryn-v3-stock-portfolio.test.mjs`

**Interfaces:**
- Consumes: source text from active application/components/styles.
- Produces: contract tests that reject legacy class generations and require the new shell/component boundaries.

- [ ] Write failing tests that require `app/layout.tsx` to load only base + new product styles and reject `v65-responsive.css`.
- [ ] Write failing tests that reject `osAuth`, `v18Auth`, and `v44Auth` on login/register.
- [ ] Write failing tests that require stock presentation components (`StockDecisionSummary`, `StockEvidenceNav`, `StockEvidenceSections`).
- [ ] Write failing tests that require a mobile-safe app shell class and safe-area content padding.
- [ ] Run the three tests and confirm RED.

### Task 2: Replace the CSS architecture

**Files:**
- Modify: `app/layout.tsx`
- Rewrite: `app/globals.css`
- Create: `app/auryn-tokens.css`
- Create: `app/auryn-product.css`
- Remove active dependency: `app/auryn.css`
- Remove active dependency: `app/v65-responsive.css`

**Interfaces:**
- Produces shared tokens and product classes used by all subsequent rebuilt surfaces.

- [ ] Keep `globals.css` to reset/base typography only.
- [ ] Define tokens for canvas, ink, paper, muted text, gold, semantic states, spacing, radii, content widths, and breakpoints.
- [ ] Implement shell, form, navigation, section, card/row, metric, tabs, and responsive primitives in `auryn-product.css`.
- [ ] Add `padding-bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + ...)` for mobile content.
- [ ] Run Task 1 shell test until GREEN.

### Task 3: Rebuild shared application shell and search

**Files:**
- Rewrite: `components/AppShell.tsx`
- Rewrite: `components/SearchBox.tsx`
- Modify: `components/AurynLogo.tsx`

**Interfaces:**
- Produces: `AppShell({children})`, responsive desktop header, mobile header/bottom nav, single-purpose search field.

- [ ] Write/extend a failing shell source contract for one desktop primary nav and one mobile bottom nav.
- [ ] Rebuild header without nested pill wrappers.
- [ ] Make search fluid with one field container and one action control.
- [ ] Ensure account menu and navigation remain keyboard accessible.
- [ ] Run shell contracts GREEN.

### Task 4: Rebuild Login and Register

**Files:**
- Create: `components/auth/AuthShell.tsx`
- Rewrite: `app/login/page.tsx`
- Rewrite: `app/register/page.tsx`

**Interfaces:**
- `AuthShell` accepts `eyebrow`, `title`, `subtitle`, `storyTitle`, `storyBody`, and children.
- Login/register retain existing Supabase submit semantics.

- [ ] Write failing tests requiring AuthShell and forbidding legacy auth classes.
- [ ] Build two-column desktop / single-column mobile AuthShell.
- [ ] Rebuild forms with plain labels/fields, clear focus states, and no oversized residual dark mobile canvas.
- [ ] Preserve Terms/Privacy/Risk links and current submit/error logic.
- [ ] Run auth contracts GREEN.

### Task 5: Rebuild Research landing

**Files:**
- Rewrite: `app/analyze/page.tsx`
- Modify: `components/SearchBox.tsx`

**Interfaces:**
- Produces one primary Research search interaction and lightweight evidence-dimension overview.

- [ ] Write failing test asserting exactly one primary search surface in the Research page body.
- [ ] Replace six bordered feature cells with lightweight evidence descriptors.
- [ ] Keep responsive hero concise on mobile and centered/dense on desktop.
- [ ] Run Research contract GREEN.

### Task 6: Split and rebuild Stock Analysis

**Files:**
- Modify: `components/StockClient.tsx`
- Create: `components/stock/StockSecurityHeader.tsx`
- Create: `components/stock/StockDecisionSummary.tsx`
- Create: `components/stock/StockActionPlan.tsx`
- Create: `components/stock/StockEvidenceNav.tsx`
- Create: `components/stock/StockEvidenceSections.tsx`

**Interfaces:**
- Presentation components consume already-computed StockClient values; scoring/data fetch logic remains in StockClient.
- `StockDecisionSummary` renders long-term, new-money, and owner guidance once.
- `StockEvidenceNav` provides responsive navigation to deeper evidence.

- [ ] Add failing source contracts requiring component split and no legacy wrapper class names on the top decision surface.
- [ ] Extract security/quote header.
- [ ] Extract the primary AURYN call and actions into one summary hierarchy.
- [ ] Consolidate entry/reassess/risk into one action plan.
- [ ] Replace repeated score cards with one key-evidence strip.
- [ ] Organize deeper evidence into Business, Fundamentals, Valuation, Technicals, Expectations, Catalysts, Institutions/Options, and Risks/Provenance.
- [ ] Keep Simple/Investor/Pro progressive disclosure semantics.
- [ ] Run stock contracts plus existing engine tests touching decision semantics.

### Task 7: Rebuild Portfolio as responsive intelligence

**Files:**
- Modify: `app/portfolio/page.tsx`
- Rewrite: `components/portfolio/PortfolioBrief.tsx`
- Rewrite: `components/portfolio/PortfolioHealth.tsx`
- Rewrite: `components/portfolio/PortfolioActionCenter.tsx`
- Rewrite: `components/portfolio/PortfolioVisualAnalytics.tsx`
- Rewrite: `components/portfolio/HoldingsIntelligence.tsx`

**Interfaces:**
- Preserve `calculatePortfolioIntelligence` and `calculatePortfolioPulse`.
- Holdings surface is the single canonical list.

- [ ] Add failing contracts for one holdings surface, no fixed-width mobile child, and compact holdings rows.
- [ ] Recompose summary: capital → condition → period/performance → priorities.
- [ ] Make driver/allocation/risk visuals fluid.
- [ ] Replace oversized holdings cards with compact rows/touch cards.
- [ ] Ensure edit/delete remain available without dominating each holding.
- [ ] Run portfolio contracts and engine portfolio tests.

### Task 8: Migrate Monitor and Trading Lab

**Files:**
- Modify: `app/alerts/page.tsx`
- Modify: `app/watchlist/page.tsx`
- Modify: `app/trading-lab/page.tsx`

**Interfaces:**
- Uses shared AppShell/product primitives.
- Paper-trading execution logic and safety gates remain unchanged.

- [ ] Add failing source contract that pages use the new shell primitives and preserve `PAPER` / no-live-money language.
- [ ] Recompose Monitor into compact actionable rows.
- [ ] Recompose Lab status/funnel/results without nested wrapper stacks.
- [ ] Preserve run-paper actions and audit details.
- [ ] Run Trading Lab and monitor contracts GREEN.

### Task 9: Remove active legacy presentation and verify

**Files:**
- Delete or archive after dependency check: `app/auryn.css`
- Delete or archive after dependency check: `app/v65-responsive.css`
- Modify: affected components that still use obsolete presentation classes.

**Interfaces:**
- Produces zero active imports of V65 responsive styling on rebuilt product pages.

- [ ] Search for legacy CSS imports/classes and migrate active occurrences.
- [ ] Run new AURYN V3 contract tests.
- [ ] Run full `npm test`; compare any failures with the recorded pre-rebuild baseline.
- [ ] Run `npm run build`.
- [ ] Search production CSS/source for obvious page-level fixed widths and legacy auth classes.
- [ ] Package source as `AURYN_V3_RESPONSIVE_PRODUCT_REBUILD.zip`.

