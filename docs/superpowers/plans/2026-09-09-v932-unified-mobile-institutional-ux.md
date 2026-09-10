# AURYN V9.3.2 Unified Mobile-First Institutional UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the V9.3.1 dashboard-like stock presentation with one synchronized mobile-first institutional research experience while preserving all canonical decision and safety logic.

**Architecture:** Keep V9.3.1 data/decision contracts unchanged. Refactor only presentation components and stock-shell information architecture, then add automated UX-source contracts and VS Code/npm workflows. Deep diagnostics remain accessible through Extreme Pro disclosures.

**Tech Stack:** Next.js, React, TypeScript, CSS, Node test runner, existing AURYN V9.3.1 reliability scripts.

**Spec:** `docs/superpowers/specs/2026-09-09-v932-unified-mobile-institutional-ux-design.md`

## Global Constraints
- AURYN only in user-visible copy.
- Preserve V9.3.1 canonical Market Truth/DecisionSnapshot/Decision Kernel semantics.
- No new provider calls or decision calculations in presentation components.
- 375px mobile layout must not horizontally overflow.
- Extreme Pro retains deep evidence but remains collapsed by default.

---

### Task 1: UX acceptance contract

**Files:**
- Create: `scripts/test-v932-ux.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: stock component and CSS source files.
- Produces: deterministic source-level acceptance gate `npm run test:v932`.

- [ ] **Step 1: Write failing source-contract tests**
  - Assert one institutional hero is rendered.
  - Assert no `v931Pillars` KPI-card grid remains in the primary brief.
  - Assert compact decision strip and ranked driver list classes exist.
  - Assert evidence nav has sticky/mobile overflow CSS.
  - Assert StockTabContext does not render `AURYN {action}`.
  - Assert Extreme Pro diagnostics remain in `<details>`.
- [ ] **Step 2: Run `npm run test:v932` and confirm RED.**
- [ ] **Step 3: Add the npm script.**
- [ ] **Step 4: Keep the test RED until Tasks 2–4 implement the contract.**

### Task 2: Institutional decision hero and evidence narrative

**Files:**
- Modify: `components/stock/v931/InstitutionalDecisionBrief.tsx`
- Modify: `app/auryn-product.css`

**Interfaces:**
- Consumes: unchanged `InstitutionalDecision`, `MarketTruth`, depth state.
- Produces: compact decision hero, action rail, ranked evidence rows, decision narrative, change/trigger rail.

- [ ] **Step 1: Replace six KPI cards with ranked evidence rows.**
- [ ] **Step 2: Replace evidence-quality banner with compact metadata line.**
- [ ] **Step 3: Group why/counter/change/trigger into an editorial research narrative.**
- [ ] **Step 4: Add mobile-first CSS and remove gray dashboard surfaces from V9.3.1 selectors.**
- [ ] **Step 5: Run `npm run test:v932`.**

### Task 3: Evidence tabs as synchronized research pages

**Files:**
- Modify: `components/stock/StockTabContext.tsx`
- Modify: `components/stock/StockEvidenceNav.tsx`
- Modify: `components/StockClient.tsx`
- Modify: `app/auryn-product.css`

**Interfaces:**
- Consumes: same canonical decision/market truth supplied by StockClient.
- Produces: compact page headings, sticky mobile nav, no duplicate tab-level verdict, supporting-only technical setup map.

- [ ] **Step 1: Remove repeated canonical action from StockTabContext.**
- [ ] **Step 2: Make evidence nav sticky and horizontal on mobile.**
- [ ] **Step 3: Keep setup map only as technical supporting evidence and subordinate it visually.**
- [ ] **Step 4: Ensure deep diagnostics are Extreme Pro-only.**
- [ ] **Step 5: Run `npm run test:v932`.**

### Task 4: Security masthead and mobile shell polish

**Files:**
- Modify: `components/stock/StockSecurityHeader.tsx`
- Modify: `app/auryn-product.css`
- Modify: `app/v65-responsive.css` only if existing responsive rules conflict.

**Interfaces:**
- Consumes: canonical display price/status already supplied by StockClient.
- Produces: compact editorial masthead and 375px-safe responsive shell.

- [ ] **Step 1: Restructure masthead into identity, ownership chip, price and market-state metadata.**
- [ ] **Step 2: Add 375px-safe CSS and overflow guards.**
- [ ] **Step 3: Run `npm run test:v932`.**

### Task 5: VS Code and command-line reliability workflow

**Files:**
- Create: `.vscode/tasks.json`
- Modify: `package.json`

**Interfaces:**
- Consumes: existing V9.3.1 reliability and live audit scripts.
- Produces: `verify:quick`, `verify:release`, `audit:live:30`, `audit:live:100`, `audit:live:500` plus VS Code tasks.

- [ ] **Step 1: Add aliases that delegate to existing scripts without duplicating logic.**
- [ ] **Step 2: Add VS Code tasks for dev, quick reliability, release gate and live audits.**
- [ ] **Step 3: Extend `scripts/test-v932-ux.mjs` to validate task/alias presence.**
- [ ] **Step 4: Run `npm run test:v932`.**

### Task 6: Full verification and package

**Files:**
- Create: `AURYN_V9_3_2_RELEASE.md`

**Interfaces:**
- Consumes: completed V9.3.2 tree.
- Produces: verified release ZIP.

- [ ] **Step 1: Run V9.3.2 focused tests.**
- [ ] **Step 2: Run V9.3.1 reliability/focused gates.**
- [ ] **Step 3: Run full AURYN regression suite.**
- [ ] **Step 4: Run preserved V8/V9.2/V9.3 gates.**
- [ ] **Step 5: Run production build if dependencies are available.**
- [ ] **Step 6: Package without secrets/cache artifacts.**
- [ ] **Step 7: Extract exact ZIP and rerun the focused V9.3.2 gate.**
