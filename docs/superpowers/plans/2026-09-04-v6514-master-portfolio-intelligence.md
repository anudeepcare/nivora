# NIVORA V65.14 Master Portfolio Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a decision-first, visually meaningful Portfolio Intelligence cockpit and a consistent readable NIVORA UX across Portfolio, Analyze and Trading Lab.
**Architecture:** Preserve V65 company scoring and trading safety. Add pure portfolio analytics for attribution, concentration, classification and period truth; compose them into one Portfolio cockpit with one holdings surface and meaningful visual modes.
**Tech Stack:** Next.js, React, TypeScript, Supabase, NIVORA V65 engine, lucide-react, dependency-free SVG/CSS visualizations.
**Spec:** `docs/superpowers/specs/2026-09-04-v6514-master-portfolio-intelligence-design.md`

## Global Constraints
Qty everywhere. Small circled i. One holdings surface. No Unknown/pending junk. No fabricated historical performance. Graph -> insight -> decision. Mobile and desktop typography both readable.

### Task 1: Global UX contract
Test then implement circled-i, desktop/mobile type scale, menu sizing, glass mobile nav across Analyze/Portfolio/Trading Lab.

### Task 2: Portfolio analytics core
Test then implement classification, allocation, concentration, contribution, priorities and portfolio brief as pure functions. Missing classifications are excluded from claims.

### Task 3: Working market-performance cockpit
Test then implement selected period, Portfolio/SPY/QQQ normalized chart, alpha and concise status without giant empty states.

### Task 4: Meaningful visual analytics
Test then implement visual switcher for Performance, Drivers, Allocation and Risk. Render correlation/risk-return only when reliable evidence exists.

### Task 5: X-Ray
Test then implement Sector/Theme/Asset/Risk views with useful known data and no Unknown cards.

### Task 6: Decision intelligence
Test then implement compact Portfolio Priorities and engine-first Portfolio Brief. Keep companyAction separate from portfolioAction.

### Task 7: One holdings experience
Test then remove all duplicate holdings/intelligence tables; upgrade the single existing holdings table/cards. Use Qty for equities and crypto on desktop/mobile.

### Task 8: Cross-app responsive polish
Test then increase Analyze and Trading Lab desktop/mobile typography, navigation and metric hierarchy; preserve behavior.

### Task 9: Regression/release
Run all engine/UI source-contract tests, TypeScript/Next build where dependencies permit, verify portfolio CRUD and Trading Lab safety, package V65.14 only after fresh verification.
