# AURYN V9.6.3 Mobile Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix standalone iPhone top chrome, stock masthead/tab overflow, and restore desktop typography baseline without changing the locked AURYN layout.

**Architecture:** Correct ownership at the CSS cascade source rather than layering screenshot-specific offsets. Standalone root/body paints chrome; app shell paints page canvas. Mobile masthead and tabs keep their current DOM and behavior with safer responsive rules.

**Tech Stack:** Next.js 15, React 19, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-12-v963-mobile-quality-design.md`

## Global Constraints
- Do not change bottom navigation geometry.
- Do not change Overview hero or price-chart geometry.
- Do not change engine logic or market data.
- Preserve theme persistence and PWA search behavior.

---

### Task 1: Standalone top chrome ownership
**Files:**
- Modify: `app/auryn-themes.css`
- Test: `tests/auryn-v963-pwa-quality.test.mjs`

- [ ] Write a failing test proving standalone root/body use `--auryn-chrome` while `.aurynAppShell` uses `--auryn-page-bg`.
- [ ] Run the test and confirm it fails.
- [ ] Add the minimal standalone override at the end of the theme layer so it wins the cascade.
- [ ] Run the test and confirm it passes.

### Task 2: Mobile stock masthead and tabs
**Files:**
- Modify: `app/auryn-mobile.css`
- Test: `tests/auryn-v963-pwa-quality.test.mjs`

- [ ] Add failing assertions for a wrapping meta/status row, non-overlapping identity/price columns, and tab snap/fade behavior.
- [ ] Run and confirm failure.
- [ ] Implement the minimal mobile CSS changes.
- [ ] Run and confirm pass.

### Task 3: Desktop typography baseline
**Files:**
- Modify: `app/auryn-themes.css`
- Test: `tests/auryn-v963-pwa-quality.test.mjs`

- [ ] Add failing assertions that text-size preferences no longer globally rescale core headings/primary values.
- [ ] Run and confirm failure.
- [ ] Scope Compact/Large rules to secondary/supporting selectors only.
- [ ] Run targeted theme and PWA regression tests.
