# Pace, dialogs and final reference composition

16 November 2026. Source candidate only.

## Actual defects corrected
- Chart zone cache used the exact clock tick as identity, hiding completed bands while rescanning each minute. Cache identity now follows UTC scan day and retains valid bands through minute updates. Day changes, data changes and stale inputs still invalidate appropriately.
- Chart scan used historical quote time while the ladder used current time. Both now use the same completed-day clock; a demo uses its recorded snapshot clock. This fixes inconsistent chart/ladder availability without manufacturing a stage.
- Insufficient completed monthly history has a concise building-history state, with the 12-month requirement available in help. Missing/stale data is not assigned P4 or fake scenario prices.
- Secondary metric/history/model detail opens outside the grid in native modal dialogs. Full datasets and explanations are retained. Escape, close, backdrop, focus return and document-scroll locking are handler-tested. Browser-native focus trapping is not claimed tested here.
- Primary evidence remains in compact equal-height desktop cards; additional fields no longer create mostly empty full-width panels.
- Public, Home, Research decision and Valuation composition follow the newest supplied reference structure. Reference dollar values, personal portfolio values and outcomes are not copied into live reports.
- News headings/cards are compact and uniform; operational copy remains concise, meaningful caveats and original source records retained.

## Coverage
Source review includes Public landing, authentication/loading shell, Home, Research Overview, Case/ownership, Business, Valuation, Technicals, Targets/estimates, News/earnings, Labs, Watchlist, Portfolio, Settings, Help and Owner controls. Earlier source inventories are retained in verification/workspace-route-audit.md and verification/research-subtab-audit.md. This is not a claim of rendered acceptance for every route.

## Known acceptance gates
The environment could not render local Chromium (socket permission failure); cloud preview was explicitly blocked. No bypass was attempted. Native-device mobile, PWA safe areas, keyboard dialogs and side-by-side pixel fidelity must still be checked in an authorized running browser. Financial model/DCA equivalence and live-provider completeness are not established by UI tests. Attribution rights are contract-specific; see verification/concise-copy-20261115/ATTRIBUTION-REVIEW.md. No production deployment or live purchase/cancellation was made.

## Consistent interaction and visual hierarchy
The supplied references, not a competitor clone, define composition. One primary answer/decision comes first, the chart provides evidence next to it, compact summary and evidence rows follow. Detailed explanations and secondary metrics use a single dialog pattern rather than changing card heights. Sapphire controls are separate from green/red/amber financial meaning; blue-depth swatches consistently identify Pace states. Responsive layouts stack in reading order, with touch-sized controls and bounded dialog height. The public page communicates the workflow before optional detail. Its chart is marked schematic because the public renderer has no authenticated live research payload; it is not presented as a live NOW quotation.

Independent source review also identified and corrected a market-identity cache guard: even if two reports reuse the same history object, prior-market bands cannot be reused while a new scan completes.

## Final source review exceptions
Read-only earnings history, congressional activity and technical-anchor explanations now use dialogs. Inline policy/cadence inputs and alert-saving workflows remain inline because unmounting them during dialog close would change stateful user work. Existing legal/administrative disclosures are not mechanically converted. This preserves behavior rather than claiming a blanket conversion of every HTML disclosure.
