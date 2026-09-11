# AURYN Mobile System Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild AURYN's mobile shell and page composition so Safari and installed iPhone PWA behave consistently across auth, Research, Portfolio, Monitor, Trading Lab and Profile.

**Architecture:** Consolidate mobile geometry into a final authoritative mobile layer rather than page-specific offset guesses. Separate public/auth and authenticated shell behavior. Page components remain responsible only for their internal responsive composition.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS, PWA/Apple Web App metadata.

**Spec:** `docs/superpowers/specs/2026-09-11-auryn-mobile-system-rebuild.md`

## Global Constraints
- Mobile breakpoints: <=760px; explicit 390/393/430px verification.
- Header owns top safe area once; bottom nav owns bottom safe area once.
- No horizontal page overflow.
- Desktop decision/engine behavior remains unchanged.
- No engine/scoring/Market Truth/portfolio-math changes.

---

### Task 1: Mobile shell contract
- [ ] Write failing shell/PWA tests.
- [ ] Consolidate safe-area header/search/content/bottom-nav geometry.
- [ ] Make account menu viewport-safe and close it on route changes.
- [ ] Run tests.

### Task 2: Auth/public shell
- [ ] Write failing login/register/reset layout tests.
- [ ] Ensure auth routes do not inherit authenticated app navigation geometry.
- [ ] Use dynamic viewport and safe-area-safe form layout.
- [ ] Run tests.

### Task 3: Research/stock shell
- [ ] Write failing stock identity/price visibility tests.
- [ ] Guarantee logo/ticker/company/current price/live state.
- [ ] Remove dead vertical space and conflicting sticky offsets.
- [ ] Run tests.

### Task 4: Responsive Technicals
- [ ] Write failing Technicals geometry tests.
- [ ] Replace mobile equal-height grid cards with compact rows.
- [ ] Preserve RSI/MACD/Volume/Bollinger semantic visuals.
- [ ] Compact desktop evidence cards.
- [ ] Run tests.

### Task 5: Portfolio mobile composition
- [ ] Write failing overflow and management tests.
- [ ] Make hero/allocation/performance/nav viewport-safe.
- [ ] Keep Add Investment visible.
- [ ] Expose View/Edit/Delete holding actions.
- [ ] Run tests.

### Task 6: Monitor/Trading Lab/Profile
- [ ] Add mobile width/overflow contracts for each route.
- [ ] Remove route-specific min-width/fixed-position assumptions.
- [ ] Run tests.

### Task 7: PWA release gate
- [ ] Add regression contracts for 390/393/430 widths and standalone shell.
- [ ] Run all V9.4.x regression gates.
- [ ] Run production build if dependencies are available.
- [ ] Package release ZIP.
