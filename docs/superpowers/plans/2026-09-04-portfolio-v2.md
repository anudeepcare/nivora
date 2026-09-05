# Portfolio V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild V65.25 Portfolio into a decision-first premium responsive experience without changing portfolio engine semantics.

**Architecture:** Keep `app/portfolio/page.tsx` as data orchestration. Recompose `PortfolioPulse` into command center/capital map/visual intelligence and progressive detail. Add a final V65.26 Portfolio-specific CSS layer so existing global responsive rules remain stable elsewhere.

**Tech Stack:** Next.js 15, React 19, TypeScript, existing CSS, lucide-react.

**Spec:** `docs/superpowers/specs/2026-09-04-portfolio-v2-design.md`

## Global Constraints
- Preserve V65.25 portfolio persistence and calculation logic.
- Never fabricate historical returns or benchmark data.
- Desktop and mobile must both be first-class.
- Information controls remain visually subordinate.
- No new network request solely for presentation.

---

### Task 1: Decision-first Portfolio Pulse
**Files:** Modify `components/portfolio/PortfolioPulse.tsx`; Modify `components/portfolio/PortfolioHealth.tsx`.
- [ ] Replace oversized hero/health-first hierarchy with command center metrics and concise interpretation.
- [ ] Add capital map from existing pulse actions.
- [ ] Move health explanation into compact progressive disclosure.
- [ ] Verify TypeScript/build.

### Task 2: Progressive visual intelligence
**Files:** Modify `components/portfolio/PortfolioVisualAnalytics.tsx`; Modify `components/portfolio/PortfolioPulse.tsx`.
- [ ] Keep meaningful visual modes visible and never render fake performance history.
- [ ] Place brief/x-ray/deeper evidence after actionable content.
- [ ] Verify build.

### Task 3: Premium holdings
**Files:** Modify `app/portfolio/page.tsx`.
- [ ] Add position weight and improve decision metadata hierarchy.
- [ ] Keep edit/delete inside accessible overflow.
- [ ] Keep desktop row and mobile card semantics identical.
- [ ] Verify build.

### Task 4: Responsive V65.26 visual layer
**Files:** Modify `app/v65-responsive.css`.
- [ ] Add scoped Portfolio V2 desktop composition.
- [ ] Add scoped Portfolio V2 mobile composition with bottom-nav-safe spacing.
- [ ] Reduce info icon emphasis and prevent horizontal overflow.
- [ ] Verify production build.

### Task 5: Release verification
**Files:** Create `V65_26_RELEASE.md`.
- [ ] Run `npm run build`.
- [ ] Run portfolio/UI contract tests relevant to V65.25.
- [ ] Package verified source as `NIVORA_V65_26_PORTFOLIO_V2.zip`.
