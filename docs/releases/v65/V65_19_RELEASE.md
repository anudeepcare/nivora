# NIVORA V65.19 — Refined Mobile Product UX

## Mobile UX
- Bottom navigation is fixed to the viewport safe area and content reserves its full height.
- Navigation uses a compact four-column frosted treatment with consistent touch targets.
- Analyze mobile metrics use a compact two-column layout with unified typography.
- Metric explanations render as bottom sheets above navigation instead of desktop-style floating popovers.
- Portfolio period/mode/X-Ray controls scroll intentionally without clipped final tabs or visible scrollbars.
- Portfolio holdings use `Qty` terminology for stock and crypto.
- Alerts now expose a delete action with confirmation and optimistic removal.
- Shared mobile typography applies to Analyze, Portfolio, Trading Lab and Alerts.
- Large portfolio surfaces avoid expensive backdrop blur.

## Data / Safety
- Existing V65.18 quote-integrity, scoring semantics and Trading Lab paper-only risk gates are unchanged.
- No new Supabase migration required.

## Verification note
- V65.19 focused UX regressions and engine TypeScript compile pass.
- The uploaded V65.18 source is missing three legacy GitHub workflow files expected by four existing tests, so the full legacy engine suite has four unrelated ENOENT failures.
- The uploaded source has no installed Next.js executable, so a local production build cannot be run from this archive.
