# NIVORA V65.4 Premium Decision UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make NIVORA a premium, mobile-first decision website that tells a user what to do within seconds, while preserving deep fundamental/technical evidence and making paper trading visibly useful.

**Architecture:** Keep the canonical V65.2 investment engine and safety gates, but improve action semantics and decision-distribution observability instead of blindly lowering thresholds. Rebuild Analyze, Portfolio, Trading Lab, metric help, and shared color/spacing rules around a single progressive-disclosure design system. All user-facing copy must use plain investment language; internal validation/version jargon stays out of primary UX.

**Tech Stack:** Next.js, React, TypeScript, Supabase, Alpaca Paper, existing NIVORA engine modules.

**Spec:** Conversation-approved direction: 5-second action → 30-second reason → 2-minute evidence; premium website, not dashboard.

## Global Constraints

- Mobile-first and desktop-friendly.
- First viewport must communicate decision, reason, entry/reassess level, and owner action.
- Deep fundamentals, valuation, technicals, risks, and horizons remain available but not in the first-glance surface.
- Metric help uses a subtle inline info glyph beside the label, never a new line and never user-facing words such as UNVALIDATED, metric contract, pipeline, or heuristic.
- Green = constructive/actionable; orange = wait/caution; red = avoid/trim/risk; neutral surfaces remain white/soft gray.
- Numbers use financial formatting and thousands separators.
- Trading Lab must explain exactly why no order occurred and provide obvious next trigger; no fake trades to manufacture activity.
- Do not weaken hard veto, falling-knife, stale-quote, consistency, or execution-risk gates.

---

### Task 1: Shared premium help + action language
**Files:** `components/v65/MetricInfo.tsx`, `lib/v65/action-policy.ts`, `app/globals.css`, tests.
- [ ] Add failing UX contract tests.
- [ ] Verify RED.
- [ ] Implement subtle same-line info glyph and concise plain-English help.
- [ ] Add WAIT_FOR_ENTRY semantic when a bullish candidate has a decision-grade preferred zone but current price is outside it.
- [ ] Verify tests.

### Task 2: Analyze decision-first experience
**Files:** `components/InvestorDecisionHero.tsx`, `components/StockClient.tsx`, `app/globals.css`, tests.
- [ ] Add failing tests for obvious clickable research controls and 5-second decision hierarchy.
- [ ] Verify RED.
- [ ] Replace metadata-looking research text with obvious pill/navigation controls and one primary “Explore full analysis” interaction.
- [ ] Collapse duplicate score walls and keep exact evidence in clearly labeled sections.
- [ ] Verify tests.

### Task 3: Portfolio priority experience
**Files:** `app/portfolio/page.tsx`, `app/globals.css`, tests.
- [ ] Add failing tests for visible first-glance portfolio priorities and non-empty intelligence behavior.
- [ ] Verify RED.
- [ ] Show capital, strongest holding, best new-money setup, review-first candidate, attention count, and holdings immediately; remove empty cards and hidden-first UX.
- [ ] Keep add-assets and structural allocation as secondary controls without making the page feel collapsed.
- [ ] Verify tests.

### Task 4: Trading Lab useful proof experience
**Files:** `app/trading-lab/page.tsx`, existing trading APIs, `app/globals.css`, tests.
- [ ] Add failing tests for plain-language trade/no-trade explanations and visible trigger conditions.
- [ ] Verify RED.
- [ ] Make first view answer: checked, actionable, traded, why not, and next trigger; hide infrastructure jargon.
- [ ] Keep one-click paper check and detailed audit below.
- [ ] Verify tests.

### Task 5: Decision-distribution guard + cleanup
**Files:** `lib/nivora-buy-calibration.ts`, `scripts/audit_decision_distribution.mjs`, `lib/nivora-version.ts`, docs/tests.
- [ ] Add tests ensuring BUY remains possible for strong evidence without bypassing hard gates.
- [ ] Verify RED where behavior is missing.
- [ ] Improve audit output to distinguish hard-blocked, near-entry, and qualified cohorts; do not tune purely to hit a BUY quota.
- [ ] Version V65.4 UX/policy surfaces.
- [ ] Run full test suite, dead-code audit, syntax check, then package clean ZIP.
