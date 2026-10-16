# Approved AURYN Glass Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan inline, then one independent review.

**Goal:** Implement the user-approved glass preview across AURYN while preserving real data, canonical decisions, saved account state and paper safeguards.
**Architecture:** Reuse the approved `au-*` styles and JSX structure. Existing authenticated data adapters and engines remain authoritative. New presentation components receive existing results; synthetic preview values never enter production.
**Tech Stack:** Existing Next.js 15, React 19, TypeScript, Supabase, lightweight-charts and lucide-react. No added paid providers.
**Spec:** docs/design/approved-glass-2026-10-16/reference.html (user approved the rendered screens and explicitly instructed immediate implementation).

## Global Constraints
- Preserve the original blue AURYN mark, glass navigation, approved spacing, component hierarchy and desktop/mobile layouts.
- Preserve existing uncommitted work and credentials; do not force-push, place trades or enable automation.
- UI values must come from real account/provider evidence. Missing inputs use the approved unavailable state, never invented numbers.
- Preserve supported metrics, source references, financial comparability checks, chart ranges and execution gates.
- One complete source ZIP, honest verification report and concise Git/Vercel instructions.

## Review Focus
- Missing or conflicting financial evidence must not become a Buy or a fabricated fair value.
- Account changes must clear cached personal data and keep writes scoped to the authenticated user.
- Symbol/range changes must not show another symbol's quote, chart or contribution state.
- Menus/dialogs must remain operable by keyboard and at 320/390px, without chart scroll capture.
- Paper controls must remain paused/blocked unless server authorization and all execution checks pass.

## Tasks
1. [x] Freeze reference, adopt shared visual primitives, shell and search. Check responsive navigation, logo and menus against the reference.
2. [x] Port stock overview, DCA card/editor, identity, navigation and chart placement. Test canonical action/missing-state mapping, allocation gates and chart ranges.
3. [x] Port business, financials, valuation, technicals, ownership, events, risks and options to the approved hierarchy; retain sourced metrics and advanced coverage.
4. [x] Port Today, Discover, Saved, Alerts, Portfolio, labs, settings/auth/help to the approved shell and content structure. Preserve functional writes and data states.
5. [x] Run release tests, production build, interaction tests and desktop/mobile visual comparisons. Fix concrete failures; independently review the final diff.
6. [x] Package every source file, reference, test report and deployment instructions; verify archive CRC, source manifest and secret exclusions.

## Execution ledger
- User approval: “I like it overall lets build exact now no deviation nothing match 100 to 100.” No further design approval required.
- Existing feature branch and uncommitted upgrade/recovery work retained. The previous release archive is not overwritten.

## Implementation and review ledger
- Reference CSS was copied verbatim into `app/approved-glass.css`; production adapters are isolated in `app/glass-integration.css`.
- Tasks 1–4 implemented in the retained worktree. Type checks and the first production build pass. The first 12 responsive browser checks pass; comprehensive checks are in progress.
- Contribution preferences use the existing owner-scoped allocation-plan storage, a dedicated validated operation, and no new database table. Two validation tests were observed failing before the new validator and passing after implementation.
- Ruling: illustrative mockup numbers, hypothetical alerts and outcome statistics are replaced by supported live fields or explicit unavailable states. Fabricating numbers to make screenshots identical would misrepresent the product. Cost: live content and state-specific card heights cannot be pixel-identical to a fictional populated reference.
- Ruling: preserve advanced source records, journal/replay, contract research and diagnostics behind secondary details or evidence dialogs. Keep the approved primary hierarchy. Cost: additional advanced entry points below the reference's main content.
- Ruling: research alert delivery remains explicitly on-refresh/in-app. The existing engine does not support background price threshold delivery; the UI must not claim it does. Cost: the illustrative background alert behavior is not implemented by this design release.
- Ruling: uncommitted prior intelligence/recovery work is retained. No clean/reset, broker order, automation activation, production deploy or shared-branch force push has been performed.
- UI acceptance tests were updated only where the approved hierarchy changes labels or where fixtures must explicitly state READY evidence. Financial source/currency/accounting-basis and execution-gate assertions remain active. The affected 37-test set now passes.

- Final review findings were corrected and regression-tested. All 944 release tests pass; the broad light/dark browser runs pass 97/37 checks. Reference comparison and remaining live limits are recorded in verification/glass-release/VERIFICATION_REPORT.md.
