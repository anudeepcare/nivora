# Brand palette and navigation refinement

## Design judgment
The broad blue wash was competing with AURYN’s citron and mint diamond rather than supporting it. The light canvas now uses pearl with restrained sage/citron depth, dark mode uses forest-charcoal, and the existing logo is unchanged. Useful panel grouping and gradients remain. The default Citron setting and its actual rendered accent now agree. Optional Ocean, Iris and Rose accents remain available.

## Changes
- Shared palette, surfaces, text and controls carry across Home, Research sections, Watchlist, Portfolio, Labs, menus and settings. Header and menu sheets have more opaque, readable surfaces.
- Main navigation, mobile dock and research sections retain a filled selected state. Pending navigation is a separate small indicator, not a temporary underline that looks like selection.
- Selection follows the current route. The tools menu no longer removes the current destination, indicates selection, and closes when selecting the current item or clicking its backdrop. Research section changes create Back/Forward history entries; repeated clicks do not rewrite history or scroll.
- Portfolio unrealized returns regain sign-based positive/negative colors; missing and zero values remain neutral. Bear/base/bull receive distinct tinted surfaces and colored values. Small-phone scenarios become clear stacked rows rather than compressed columns.
- Only the requested “Test assumptions” shortcut is removed. What the price needs, model ranges, scenarios, assumption disclosures, the projection calculator and assessment tools remain.
- Browser chrome, manifest and offline fallback match the new palette. The offline cache is versioned so a future authorized release can refresh its offline surface. Updates still require the user’s existing Update & reload action.

## App-wide follow-up
The public landing’s illustrative demo now owns a complete dark palette, preventing pale labels on light scenario surfaces. Meaningful mobile demo labels use readable sizes and its Next control has a 44px target. Standalone public guides/tools, pricing, contact, legal/help, release notes, sign-in and recovery reserve device safe areas. Release-note headings now use theme-aware colors. Recovery logic and markup remain unchanged; its safe-area change is padding-only.

A credential-free production-build smoke check covers all 31 declared page routes and verifies that development previews and unknown routes return 404. These checks verify HTTP output, not authenticated app flows or rendered layouts. Source review checked the route map and literal internal links. Physical mobile/desktop rendering is still an acceptance gate. The public menu returns focus to its toggle on Escape, and public navigation marks the current destination, including Pace.

## Scope and integrity
No production deployment, push, account operation or migration was performed. Financial calculations, market inputs, provider selection, APIs and database files are unchanged. The only changed file under lib is appearance.ts, containing presentation color definitions. No new account data or credentials were added.

## Verification
Current results are recorded in verification/brand-navigation-20261115/summary.json. Regression tests were observed failing before the palette, selection, return-color and shortcut fixes. Independent source review found no actionable defects and confirmed the installed Next router supports the section-history API used here.

Actual rendering remains unverified: local Chromium cannot create a required socket, including with permitted elevation. The separate cloud browser could not connect to the preview. No screenshots of this final candidate or physical-device results were obtained. Static contrast checks and executable navigation tests are not visual approval.

## Acceptance before any deployment
1. Use Node 24, run npm ci, npm run verify and npm run test:api.
2. Run AURYN_ENABLE_PREVIEW=true npm run dev. Locally inspect /preview/overview, /preview/research/MSFT, /preview/watchlist and /preview/portfolio. These routes are fixture-only, localhost-only and disabled in production.
3. Inspect 320, 390, 768 and 1440px widths in light/dark, with standard/large text. Visit every Research section and Lab; expand risks, business checks, consensus, model ranges and assessment tools. Confirm unchanged numbers/dates, readable colors, aligned grids and no document overflow.
4. Repeatedly switch primary and research navigation. Test Back/Forward, current menu item, Escape, backdrop, Close, search, keyboard focus and lower safe-area clearance. Confirm the selected filled surface persists after the loading indicator disappears.
5. Test installed iOS/Android portrait/landscape, keyboard, offline recovery and update acceptance. Do not use this source archive as evidence of production-account, live-provider or physical-device validation.
