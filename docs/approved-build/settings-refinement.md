# Settings, navigation, and header refinement

## Root causes

- The supplied 7.17.16 screenshot showed the `/settings` page. The 7.17.54 screenshot showed `Shell` opening a second, independently implemented `SettingsSheet` dialog from the avatar over that page. Both implementations defaulted to Appearance, and both hid Sign out inside Account.
- Neither settings implementation retained its entry screen or offered Back. A home-only fallback would lose a company URL, selected query, and anchor.
- `DisplayPreferences` rendered a `.toggle > i` thumb from `studio-foundation.css`, while `approved-mockup.css` also rendered `.toggle::before` as a thumb. Both appeared at once.
- Explore already opened tools; it was not a research navigation action. The dialog's generic workspace wording, unillustrated rows, and unconditional inclusion of the current route made its purpose less clear.
- Settings navigation buttons and links inherited different typography. Header Plans had no explicit treatment, and a generic mobile rule hides non-icon links—including an avatar changed from button to link unless overridden at sufficient specificity.

## Implementation

- Deleted `components/SettingsSheet.tsx`; the avatar, rail Settings link, and Explore Settings entry all navigate to the single `/settings` page. Clicking Settings while already there does not stack a route or modal.
- `lib/settings-navigation.ts` validates a return destination within the same live/preview workspace. Shell captures the full current pathname, query, and hash in `?from=`. The Settings Back link restores that destination. Direct settings entry has an overview fallback; external, login/API, cross-preview, and nested Settings destinations are rejected.
- `SupportingViews.Settings()` now presents Back and Sign out above the page heading, always visible regardless of category. It retains display, research, account identity/providers, password update, plans/billing, alerts, help, owner admin access, and legal links. Authentication writes remain disabled in preview. Sign-out failures appear in the page-level status area.
- Replaced the inherited toggle with a purpose-specific accessible switch (`role="switch"`, `aria-checked`) and one thumb.
- Explore retains Discover, Compare, Research Lab, Paper Lab, Help, and Settings, omits the current destination, and clearly labels its distinct icon-based surface “Explore tools.”
- Added `app/settings-refinement.css` for the approved light/dark tokens, coherent 14px navigation, a contained white preference panel, mobile layout, focus treatment, a readable Plans link, and the mobile avatar override. Root owns its stylesheet import.
- Corrected the existing FreeSnapshot “Explore Pro features” destination from Settings to Plans, with root authorization.

## Changed files owned by this task

- `components/Shell.tsx`
- `components/SupportingViews.tsx` (Settings function and scoped imports only)
- `components/DisplayPreferences.tsx`
- `components/SettingsSheet.tsx` (removed)
- `components/FreeSnapshot.tsx` (one link target)
- `lib/settings-navigation.ts` (new)
- `app/settings-refinement.css` (new)
- `tests/settings-refinement.test.mjs` (new)
- `tests/workspace-navigation.test.mjs` (Shell dependency bindings)
- `tests/ui-controls.test.mjs` (replace duplicate modal expectation with the single page contract; switch accessibility state)

## Verification

The first new regression run failed all five original cases on the old avatar button, missing distinct tools label, hidden Sign out/missing Back, absent return URL validation, and the old toggle semantics. After implementation these passed. The FreeSnapshot destination regression separately failed with `/settings` before the link fix and passed afterward.

- Settings, workspace navigation, scroll restoration, and existing UI controls: **74/74 passed** before the extra FreeSnapshot test. The UI controls file emitted existing unrelated React SVG `<title>` child-array warnings; no test failures.
- Settings, navigation, appearance, theme, auth provider, and auth launch checks: **29/29 passed**.
- Latest focused run after the FreeSnapshot and mobile selector corrections: **20/20 passed**, including **9 new Settings regressions**.
- Full suite, typecheck/build, and browser desktop/mobile verification are coordinated by root. No claim of live authentication validation is made: this task performed no live auth writes, commit, or deploy.

## Browser checks for integration

1. From `/research/MSFT?tab=financials&q=cloud#income`, enter Settings using the avatar; verify one page, visible Sign out, and Back restoring the full original URL. Repeat with watchlist/portfolio and preview routes.
2. On Settings, activate the avatar and rail Settings again; verify no nested surface or extra navigation.
3. Open Explore from Settings and Compare; verify current destination omitted, other tools present, close/Escape and keyboard focus work.
4. On narrow mobile, verify the avatar remains visible, all Settings categories and support links remain reachable, the preference panel does not overflow, and the switch has one thumb in both states.
5. Verify light remains the default and dark, text size, research mode, accent, spacing, and reduce-motion preferences still respond.
