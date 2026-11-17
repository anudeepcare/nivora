# Approved public/account implementation report

Implemented the approved mock-public visual structure in the real public and account routes. PublicLanding uses the approved header, hero, research preview, principles, connected feature sections, and footer. Public examples remain explicitly fictional (Northstar Labs); no real stock is named. The existing interactive illustrative research remains available on `/sample`.

Login, signup, email-reset request, and password recovery use the approved split story/form layout. The narrow-screen version prioritizes the form and hides decorative story content. Compact height-aware spacing, 44px form controls, 16px inputs, `min-height: 100svh`, and normal document flow keep primary actions accessible without fixed-height clipping. Errors, confirmation feedback, browser zoom, and the on-screen keyboard can naturally extend the page. Desktop/phone viewport measurements are pending the root agent's browser verification.

Real account behavior is retained: configured Google and X OAuth, email/password login, signup, email confirmation/resend cooldown, secure recovery callback, password update, auth error feedback, and workspace navigation. Signup adds the approved optional name field and stores it in Supabase `full_name` metadata; the existing account display-name behavior already consumes that metadata. Password visibility is accessible, and `/login?mode=reset` opens the actual reset request mode. No demo auth behavior was introduced.

Only these implementation files were changed: `components/PublicLanding.tsx`, `components/Session.tsx` (Login plus the subsequently authorized preference hydration fix), `components/PasswordRecovery.tsx`, `app/approved-public.css`, and `tests/approved-public.test.mjs`. ProductSession, account cache, useResource, and access boundaries are unchanged. StoreProvider subsequently received the scoped preference hydration fix described below. Root owns the stylesheet import and shared design tokens.

## Verification

- Test-first: new render/interaction expectations failed on the prior public/account markup, missing signup name metadata, OAuth accessible names, and recovery structure before implementation.
- Focused command: `node --experimental-strip-types --test tests/approved-public.test.mjs tests/auth-launch.test.mjs tests/auth-providers.test.mjs tests/ui-controls.test.mjs` — **72 passed, 0 failed**.
- The 10 new public/account tests exercise real components and form handlers with auth transport doubles. Coverage includes fictional-data disclosure and primary routing, all three auth modes, native labels/autocomplete, exact trimmed email and unmodified password payloads, signup metadata, fixed reset callback, available/disabled OAuth providers, password mismatch validation, linked reset mode, resend cooldown, and recovery success/expired-link behavior.
- `npx tsc --noEmit --incremental false` — **passed**.
- `git diff --check` — **passed**.
- Full `npm test` at the concurrent-work checkpoint: **616 passed, 1 failed (617 total)**. The only failure was `tests/approved-research.test.mjs` with `ERR_MODULE_NOT_FOUND` for `lib/approved-research.ts`, which another workstream had not created at that point. No public/auth baseline test failed. Root should run the final consolidated suite once all workstreams finish.
- No browser was opened and no production build or live account/provider transaction was performed by this scoped workstream. Root coordinates those checks.

## Integration notes

Import `app/approved-public.css` after the existing public/entry styles. Its `mp-*` rules use the approved shared `--ink`, `--muted`, `--blue`, `--blue-soft`, `--line`, and `--surface` tokens. Check `/`, `/sample`, `/login`, `/login?mode=signup`, and `/login?mode=reset` at 1365×768, 390×844, and 360×740; check `/reset-password` with an authenticated recovery session. Additional status/error copy may extend the page without hiding its controls.


## Browser-feedback follow-up

The compact phone hero now collapses redundant preview toolbar, evidence breakdown, footer strip, and floating badge while retaining the fictional company, readable price/chart, title, body copy, and primary actions. At phone heights at or below 780px, it also collapses the illustrative case text. Short desktop viewports receive smaller chart heights and tighter preview spacing. This pass changed only `approved-public.css` and passed all 10 public/account tests and diff checks; root performs the browser measurements.

## Preference hydration fix

Root observed a real browser hydration mismatch after saving Dark and reloading `/preview/settings`: the server selected Light, but the client initializer read localStorage and selected Dark. The settings DOM could retain the incorrect selected control even though the boot script correctly displayed the dark palette.

StoreProvider now initializes preferences deterministically for the server and first client render, hydrates saved preferences in its mount effect, and waits for that hydration before applying theme, text-size, or motion DOM attributes. This avoids overwriting the boot script's saved appearance with temporary defaults. Persistence remains in the explicit user setters.

The regression test failed on the original dark-versus-light initial state mismatch before the fix. It now verifies matching initial preference values, no default DOM writes during the first mount, restored dark/large/reduced-motion values, no storage writes during hydration, and a later System selection that updates and persists normally.

- Expanded focused suite: **74 passed, 0 failed**.
- Final full `npm test` from this workstream: **630 passed, 0 failed**.
- `git diff --check`: passed.
- A raw concurrent `tsc --noEmit --incremental false` check encountered inconsistent generated `.next/types` files (`AppRouteHandlerRoutes` missing, route `ParamMap` constraints). It reported no Session/component source error. Root must regenerate Next route types during the final consolidated typecheck/build; this generated-type run is not reported as passing.
