# AURYN V3 Complete Product Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the AURYN V3 migration across shell/footer, Portfolio, stock evidence, Monitor/Lab, and legal navigation without changing investment-engine behavior.

**Architecture:** Add one reusable product footer to the shared shell, finish the AURYN V3 styling/component migration for Portfolio, isolate deeper stock evidence behind a consistent evidence surface, and remove user-visible NIVORA copy. Keep all engine/data interfaces unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS, Supabase, Lucide, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-05-auryn-v3-complete-product-shell-design.md`

## Global Constraints
- Preserve decision-engine, provider, Supabase, portfolio calculation, and paper-trading behavior.
- No live-money trading.
- No user-visible NIVORA copy on migrated surfaces.
- No page-level horizontal overflow.
- Footer must expose About, Methodology, Terms, Privacy, and Risk Disclosure.
- Do not re-import `app/auryn.css` or `app/v65-responsive.css`.

---

### Task 1: Product footer contract
**Files:** Create `components/ProductFooter.tsx`; modify `components/AppShell.tsx`, `app/page.tsx`, `components/auth/AuthShell.tsx`; test `tests/auryn-v3-complete-shell.test.mjs`.
- [ ] Write failing contract requiring ProductFooter and all five legal/product links.
- [ ] Implement ProductFooter and mount it in AppShell.
- [ ] Replace landing footer with ProductFooter and extend auth legal navigation.
- [ ] Run contract GREEN.

### Task 2: Portfolio presentation completion
**Files:** Rewrite presentation in `components/portfolio/PortfolioPulse.tsx`, `PortfolioVisualAnalytics.tsx`; modify `app/auryn-product.css`; test `tests/auryn-v3-portfolio-complete.test.mjs`.
- [ ] Write failing contract rejecting legacy portfolio presentation classes in the two active top-level components.
- [ ] Migrate pulse summary, periods, metrics, priorities, visuals, and evidence toggle to AURYN V3 classes.
- [ ] Add responsive CSS for every migrated class.
- [ ] Run contract GREEN.

### Task 3: Stock evidence containment
**Files:** Modify `components/stock/StockEvidenceSections.tsx`, `app/auryn-product.css`; test `tests/auryn-v3-stock-evidence-surface.test.mjs`.
- [ ] Write failing contract requiring a named AURYN evidence surface and responsive section normalization.
- [ ] Add the evidence surface boundary and consistent section/card/tab treatment.
- [ ] Ensure the stock route remains wrapped in AppShell.
- [ ] Run stock contract GREEN.

### Task 4: Copy and legal cleanup
**Files:** Modify `lib/v65/portfolio.ts`, `lib/nivora-metrics.ts`, `app/about/page.tsx`, `app/methodology/page.tsx`, `app/terms/page.tsx`, `app/privacy/page.tsx`, `app/disclaimer/page.tsx`, `app/auryn-product.css`; test `tests/auryn-v3-copy-legal.test.mjs`.
- [ ] Write failing test for user-visible NIVORA copy and legal page styling.
- [ ] Replace migrated copy with AURYN.
- [ ] Add V3 legal page layout/typography.
- [ ] Run contract GREEN.

### Task 5: Monitor/Lab shell verification and package
**Files:** `app/alerts/page.tsx`, `app/trading-lab/page.tsx`, `tests/auryn-v3-complete-shell.test.mjs`.
- [ ] Assert both routes use AppShell and Lab retains PAPER/no-live-money language.
- [ ] Run all AURYN V3 tests.
- [ ] Run available TypeScript/build verification; report environment limits accurately.
- [ ] Package `AURYN_V3_3_COMPLETE_PRODUCT_SHELL.zip`.
