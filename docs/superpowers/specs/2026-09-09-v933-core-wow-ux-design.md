# AURYN V9.3.3 Core WOW UX Design

## Goal
Create one compact, expert-grade stock decision surface that exposes the canonical call, actionable levels, specific supporting/contrary evidence, and decision-change conditions without expanders, duplicate verdicts, or execution-state clutter. Astra runs automatically as a grounded challenger and never becomes required for core functionality.

## Core hierarchy
1. Security + canonical 24/7 price/session.
2. One dark AURYN call with a precise explanation.
3. New Money / Owner / Long Term only; execution state is omitted from research UI.
4. Always-visible Entry, Confirm, Support, T1, T2, Invalidation.
5. Why / Against / What changes it; What changed only when applicable.
6. Research tabs immediately after the core.
7. Deeper metrics live directly in the relevant tab, not global expanders.

## Astra
Astra uses `gpt-6-astra` through `/v1/responses`, auto-runs from the canonical DecisionSnapshot, and may add a grounded analyst synthesis only after validation. Missing credentials, timeout, rate limit, or grounding failure render nothing. Astra cannot alter price, levels, actions, sizing, or execution permission.

## Mobile
375px is a hard layout gate. Core levels use a horizontally scrollable compact strip if needed; no page-level horizontal overflow. Decision content is one column and tap-free for essentials.

## Non-goals
No changes to Market Truth, DecisionSnapshot semantics, V9.3 feature tournament, or Trading Lab execution policy.
