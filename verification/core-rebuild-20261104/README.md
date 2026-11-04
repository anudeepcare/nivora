# AURYN core migration — 2026-11-04

Status: local foundation migration, not a completed whole-app redesign or a deployment.

## Implemented

- Root entry separates compatibility styles, core document/theme rules, and appearance preferences.
- 39 existing stylesheets are isolated inside the explicit `compatibility` cascade layer, preserving their financial feature styles while giving component modules clear precedence.
- Real `@layer` blocks are used. This Next CSS loader incorrectly converted `@import ... layer(compatibility)` into `@media layer(compatibility)`; that approach was removed after a browser check exposed unstyled content.
- Shared workspace has explicit 100% width, one maximum width, and shared gutters, independent of active tab content.
- Settings has its own module for account row, sections, controls, and support links; it no longer depends on the old workspace shell class for geometry.
- Shared empty-state alignment is owned by its component module.
- Existing public tokens follow shared theme tokens; authentication and retained feature panels keep their required scopes.
- No financial calculation, provider, account entitlement, or billing logic changed in this migration.

## Evidence and limits

- Browser viewport: 1363 by 936 CSS pixels.
- All nine research tabs opened; main width stayed 1353px and no document horizontal overflow was reported. Tab content includes Overview, Case & ownership, Business, Valuation, Technicals, Analysts, News & earnings, Advanced, Options.
- Home, Research list, Watchlist, Portfolio, Discover, Settings navigation checked. Same shared main width reported on the main app routes.
- Settings inspected in light and dark mode; account card and summary text alignment corrected.
- Public landing and login visually inspected. Login renders its controls but authentication is unavailable in local configuration.
- Portfolio preview shows holdings, cash, valuation history, allocation and data caveats.
- Preview options intentionally has no invented contracts; live provider success has NOT been established.
- Mobile device/PWA visual verification remains outstanding. Responsive source tests are not equivalent to device verification.
- Legacy feature CSS is isolated, not fully migrated/deleted. This is NOT a claim of a clean-sheet redesign of every screen.

## Release gate still open

1. Migrate the remaining feature surfaces to component-owned styles and remove their superseded compatibility rules.
2. Verify mobile/PWA safe areas, keyboard, wide tables, scroll restoration, dialogs and touch charts on device-sized surfaces.
3. Verify authenticated Free/Pro/owner routes and actual provider data in an authorized configured environment.
4. Capture and compare the final approved pages and states before publishing. No mock-to-build parity claim has been made.

## Automated verification

- `npm test`: 874 passed, 0 failed after the final component changes.
- `npm run build`: production bundling and TypeScript validation (final rerun recorded in local build log).
- `npm run test:api`: passed during the foundation migration; includes billing, access, options, shared-market and owner-expiry checks. Synthetic transport/database coverage is identified by the individual runners.
- `git diff --check`: passed.
- Added cascade dependency validation to prevent unlayered compatibility imports and reject the loader-incompatible `@import layer()` form.
- Existing render-test harnesses now supply the Settings CSS-module binding; their behavioral assertions remain intact.
