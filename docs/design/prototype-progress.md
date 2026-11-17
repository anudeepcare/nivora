# AURYN design prototype progress
Plan: docs/superpowers/plans/2026-11-04-auryn-product-reset.md
Scope: Tasks 1–10 local visual prototype; Tasks 11–12 remain gated on visual approval.
Ruling: work in the existing feature checkout with a new v2 namespace and guarded explicit preview route. No current production component is replaced and existing uncommitted changes are preserved.
Ruling: prototype uses illustrative deterministic fixtures. Live adapters and complete metric migration remain separate, explicitly unfinished tasks. Prototype interactions must not imply live execution.
Pre-flight: the same stage labels, section IDs and chart range state will be shared by all prototype screens. No new financial policy is introduced.

## Reviewable draft — 2026-11-04

Implemented a separate local-only prototype at `/preview/redesign`. It contains 12 screen destinations, nine company research sections, a reusable Pace instrument, line/candle chart with range selection and inspection, company search, basic filtering/sorting, theme controls, sample alerts, and example loading/empty/stale/error/restricted states.

This is **not completion of Tasks 1–10**. It is the first concrete visual draft. No production component, financial engine or account integration was replaced. The middleware change allows only this exact preview route when the local-host check and explicit preview flag pass.

### Observed verification
- Desktop browser: all 12 destinations and all nine research sections render; range and line/candle controls change the chart.
- Light/dark Settings rendered and inspected.
- Desktop document width remained within the viewport across all destinations.
- Initial repository suite: 879 tests passed, 0 failures. Final rerun recorded separately below.
- Reviewer identified unnamed collapsed navigation and tiny Pace labels. Added explicit accessible navigation names and 12px short stage labels with full accessible names.
- Sample quote/history endpoint aligned; quarterly/annual table fixtures now switch together. Only one sample option expiration is offered.

### Explicit remaining work
- Mobile/tablet visual verification is NOT passed. The browser exposes no viewport resize control; an iframe review attempt was blocked by existing frame security headers and was removed without changing those headers.
- Exact visual approval is outstanding. This draft is not rated 10/10.
- Full prototype coverage still needs account/security/billing flows, complete advanced tools, an actual options strategy builder, compare, help/legal and other inventory flows. Existing placeholder notices remain visible.
- Research sample metrics are illustrative layout fixtures, not recalculated market studies. They do not prove metric accuracy.
- Live-data adapters, entitlement checks, full feature migration and the 200-ticker validation remain unfinished. No comparison accuracy claims against DCA Optimizer are supported by this draft.
- Prototype state is temporary, and navigation is not yet encoded into browser history.

Ruling: deliver this as a clearly labeled visual draft, not a production rebuild or a feature-complete prototype. Cost: further work is required before mockup approval and migration.

Final verification: `npm run verify` exited 0: 879 tests passed, TypeScript passed, optimized Next build passed. Browser checks remain desktop-only.
