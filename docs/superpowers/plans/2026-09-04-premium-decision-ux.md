# NIVORA V65.4 Premium Decision UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a production-buildable V65.4 decision-first UX without changing the core investment engine.

**Architecture:** Keep existing Next.js routes and engine modules. Concentrate UX behavior in InvestorDecisionHero, MetricInfo, Portfolio, Trading Lab, authentication pages and V65.4 CSS overrides; protect behavior with contract tests.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, lucide-react, node:test.

**Spec:** `docs/superpowers/specs/2026-09-04-premium-decision-ux-design.md`

## Global Constraints
- Preserve V65.4 decision/business logic and paper-only execution safety.
- Decision-first, mobile-first, no dashboard clutter.
- No unexplained threshold strings as the primary explanation.
- One inline info glyph; viewport-safe help.
- Full `npm test` and `npm run build` must pass.

---

### Task 1: UX contract coverage
**Files:** Test: `tests/v655-decision-ux.test.mjs`
- [ ] Write failing source-contract tests for viewport-safe help, threshold explanation, obvious research controls, portfolio simplification, Trading Lab clarity and auth copy.
- [ ] Run the test and verify RED.

### Task 2: Decision and help UX
**Files:** Modify: `components/InvestorDecisionHero.tsx`, `components/v65/MetricInfo.tsx`, `app/globals.css`
- [ ] Implement plain-language qualification explanation and decision-first research navigation.
- [ ] Make info help a single glyph with viewport-safe desktop placement and mobile sheet behavior.
- [ ] Run targeted tests and verify GREEN.

### Task 3: Portfolio and Trading Lab simplification
**Files:** Modify: `app/portfolio/page.tsx`, `app/trading-lab/page.tsx`, `app/globals.css`
- [ ] Remove redundant portfolio “Start here” framing and strengthen priority/action hierarchy.
- [ ] Simplify Trading Lab language around actionable decisions, blockers and results.
- [ ] Run targeted tests and verify GREEN.

### Task 4: Authentication modernization
**Files:** Modify: `app/login/page.tsx`, `app/register/page.tsx`, `app/globals.css`
- [ ] Tighten auth copy and premium responsive presentation while preserving Supabase flows and legal links.
- [ ] Run targeted tests and verify GREEN.

### Task 5: Production verification and package
**Files:** Modify only if verification exposes a defect.
- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Remove build artifacts and secrets from deliverable.
- [ ] Zip the verified source tree as a new versioned release.
