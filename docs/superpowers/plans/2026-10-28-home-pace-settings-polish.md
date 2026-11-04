# Home, Pace & Settings Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the authenticated Home and Settings surfaces visually coherent and ensure every available AURYN Pace reading is visible without inventing missing history.

**Architecture:** Keep the existing enterprise React components and policy layer. Fix presentation at the shared Pace summary component, refine the workspace CSS with existing design tokens, and pin behavior with focused Node tests plus the existing full verification suite.

**Tech Stack:** Next.js, React/TypeScript, CSS custom properties, Node test runner.

**Spec:** Screenshots supplied in this conversation and the existing AURYN Pace contract in `lib/pace-presentation.ts`.

## Global Constraints

- Do not turn a missing reading into P0 or a Buy instruction.
- Keep confirmed and forming readings separately labelled and dated.
- Preserve Business → Value → Risk → Pace separation.
- Keep mobile touch targets and readable typography at every viewport.

## Review Focus

- A ticker with only a forming reading must show its P-level and “forming” state; it must not disappear.
- A ticker with neither reading must show pending/history needed, not 0×.
- Settings shortcuts must remain aligned as a single grid, including the analytics control.
- Home cards must retain readable contrast and numeric tabular alignment in light and dark themes.
- Existing Pace semantics and all enterprise tests must remain unchanged.

### Task 1: Pace availability presentation

**Files:**
- Modify: `components/ResearchSummary.tsx`
- Test: `tests/pace-product.test.mjs`

**Interfaces:**
- Consumes `perspective(r).dca.confirmed` and `.forming`.
- Produces a compact DCA/Pace card that uses the latest available reading while preserving its period label.

- [ ] Add a test for confirmed-only, forming-only, and no-reading research snapshots.
- [ ] Update the card to render forming P-levels when confirmed history is unavailable, with explicit “Current month · forming” copy.
- [ ] Keep no-reading state as “History needed” and “View coverage”.
- [ ] Run the focused Pace tests.

### Task 2: Settings and analytics layout

**Files:**
- Modify: `app/workspace-experience.css`
- Test: `tests/settings-refinement.test.mjs`

**Interfaces:**
- Consumes the existing `workspace-settings-shortcuts` markup and `PrivacyChoices` control.
- Produces a stable two-column desktop / one-column mobile shortcut grid with no orphaned analytics link.

- [ ] Add assertions that analytics preferences belongs to the shortcuts grid and has an accessible label.
- [ ] Normalize shortcut spacing, icon column width, and text wrapping for support email and analytics preferences.
- [ ] Verify the mobile single-column layout and focus-visible states.

### Task 3: Home visual system and typography

**Files:**
- Modify: `app/auryn-experience.css`
- Modify: `app/workspace-experience.css`
- Modify: `app/mobile-final.css`
- Test: `tests/home-workspace.test.mjs`

**Interfaces:**
- Consumes existing Home class names and theme variables.
- Produces a stronger but restrained gradient system, consistent font sizing, and tabular metric alignment.

- [ ] Add/adjust home assertions for command metrics and card labels.
- [ ] Refine hero, summary strip, panel accents, and number typography without changing copy or data semantics.
- [ ] Add mobile overrides for compact spacing and no horizontal overflow.

### Task 4: Verification

- [ ] Run `npm run verify` from the enterprise tree.
- [ ] Confirm the source ZIP is regenerated only after tests/build pass.

