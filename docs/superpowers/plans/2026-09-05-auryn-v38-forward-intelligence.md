# AURYN V3.8 Forward Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an evidence-gated forward-looking decision engine and align stock, portfolio, mobile search, footer, and PWA presentation to it.

**Architecture:** Add a strategic-context layer in the canonical investor engine, derive explicit long-term/new-money/owner decisions from separate evidence families, and make all UI surfaces consume those canonical fields. Keep legacy fields for compatibility while eliminating contradictory presentation.

**Tech Stack:** Next.js, React, TypeScript, Node test runner, Supabase-backed portfolio data.

**Spec:** `docs/superpowers/specs/2026-09-05-auryn-v38-forward-intelligence-design.md`

## Global Constraints
- No ticker-specific recommendation rules.
- Missing evidence lowers confidence; it is not bearish evidence.
- Technicals primarily affect timing, not long-term thesis.
- REDUCE/EXIT requires structural deterioration or hard-veto evidence.
- Mobile footer and search must preserve usable screen space.

---

### Task 1: Strategic context and canonical decision bundle
**Files:** Modify `lib/nivora-investor.ts`, `lib/nivora-today.ts`; create `tests/auryn-v38-forward-intelligence.test.mjs`.
- [ ] Write failing tests for strategic context, long-term/new-money/owner separation, and anti-overreaction behavior.
- [ ] Implement evidence-gated strategic context from existing fundamentals/context/market regime.
- [ ] Derive canonical action bundle and preserve legacy compatibility.
- [ ] Run focused tests.

### Task 2: Stock presentation consistency
**Files:** Modify `components/StockClient.tsx`, `components/stock/StockDecisionSummary.tsx`, `components/stock/StockThesisPanel.tsx`, `app/auryn-product.css`.
- [ ] Test long-term/new-money/owner labels and qualitative score labels.
- [ ] Move ownership control near security header.
- [ ] Increase mobile analytical typography and reduce menu clutter.
- [ ] Run focused UI contract tests.

### Task 3: Portfolio consumes owner action
**Files:** Modify `app/portfolio/page.tsx`, `components/portfolio/HoldingsIntelligence.tsx`, `components/portfolio/PortfolioCompositionGraph.tsx`.
- [ ] Test portfolio uses canonical owner action.
- [ ] Tighten mobile holding rows and add interactive metric explanations.
- [ ] Run portfolio tests.

### Task 4: Search, footer, and PWA polish
**Files:** Modify `components/AppShell.tsx`, `components/SearchBox.tsx`, `components/ProductFooter.tsx`, `app/auryn-product.css`, `app/layout.tsx`, `public/manifest.webmanifest`, icon assets.
- [ ] Test no duplicate mobile search on Research landing.
- [ ] Compact footer on desktop and mobile.
- [ ] Ensure installed icon matches AURYN mark.
- [ ] Run UX tests.

### Task 5: Verification and packaging
- [ ] Run all AURYN V3/V3.8 tests.
- [ ] Run TypeScript syntax/transpile checks.
- [ ] Attempt production build and report any environment limitation exactly.
- [ ] Package `AURYN_V3_8_FORWARD_INTELLIGENCE.zip`.
