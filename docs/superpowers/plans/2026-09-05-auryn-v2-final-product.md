# AURYN V2 Final Product Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved AURYN mobile-first decision product architecture on the existing validated engine/data foundation.

**Architecture:** Keep stable internal engine APIs and Supabase data paths; replace the presentation hierarchy with an AURYN-native shell and decision cockpit. Add lightweight integrity/presentation derivations at the UI boundary rather than duplicating engine scoring.

**Tech Stack:** Next.js, React, TypeScript, CSS, Supabase, existing NIVORA/V65 internal engine modules.

**Spec:** `docs/superpowers/specs/2026-09-05-auryn-v2-final-product-design.md`

## Global Constraints
- Same Supabase project and existing user/portfolio data.
- No visible NIVORA branding.
- No AURYN brand green; semantic positive/negative only.
- Mobile-first and zero-scroll decision are release acceptance rules.
- Stable internal `nivora-*` engine module/function names are not renamed for branding.
- No scoring/market-data claims invented without evidence.

---

### Task 1: Brand shell, search and public surfaces
**Files:** `components/AppShell.tsx`, `components/AurynLogo.tsx`, `components/SearchBox.tsx`, `app/auryn.css`, auth/public/legal/methodology pages.
- [ ] Add failing brand/search/public regression tests.
- [ ] Make global search functional rather than decorative.
- [ ] Remove stale visible NIVORA/V61 copy and legacy logo usage.
- [ ] Normalize public/auth styling and mobile behavior.
- [ ] Run tests.

### Task 2: Zero-scroll stock decision cockpit
**Files:** `components/StockClient.tsx`, `components/InvestorDecisionHero.tsx`, new decision presentation component(s), `app/auryn.css`.
- [ ] Add failing tests for above-fold decision hierarchy and metric help alignment.
- [ ] Collapse oversized quote/context/dashboard surfaces into compact canonical quote + decision cockpit.
- [ ] Surface long-term/new-money/owner decisions, top reasons, entry/confirmation/reassess, confidence and compact evidence pillars before deep research.
- [ ] Add quote consistency warning derivation without changing engine score logic.
- [ ] Run tests.

### Task 3: Metric explanation and research depth
**Files:** `components/v65/MetricInfo.tsx`, `lib/nivora-metrics.ts`, research navigation/presentation components.
- [ ] Add failing tests for secondary baseline-aligned help affordance and explanation content.
- [ ] Replace attention-grabbing circled info icon with subtle contextual help mark.
- [ ] Standardize label/value/trend/why-it-matters patterns.
- [ ] Keep full research sections below fold.
- [ ] Run tests.

### Task 4: Portfolio intelligence V2
**Files:** `app/portfolio/page.tsx`, `components/portfolio/*`, `app/auryn.css`.
- [ ] Add failing tests for no legacy allocation accordion, benchmark/return/cost basis/cash/concentration surfaces and mobile overflow protection.
- [ ] Build Portfolio Command Center and Portfolio Brief.
- [ ] Add Overview/Performance/Allocation/Risk/Decisions/Holdings deep navigation.
- [ ] Keep edit/delete actions compact and responsive.
- [ ] Run tests.

### Task 5: Monitor, Lab, responsive hardening and verification
**Files:** `app/alerts/page.tsx`, `app/trading-lab/page.tsx`, shared CSS/tests.
- [ ] Add regression tests for mobile overflow, safe-area nav, AURYN vocabulary and paper-only Lab status.
- [ ] Restyle Monitor and Lab into the same product grammar.
- [ ] Run targeted tests, engine TypeScript compile and production build when dependencies permit.
- [ ] Package without secrets/dependencies/build artifacts.
