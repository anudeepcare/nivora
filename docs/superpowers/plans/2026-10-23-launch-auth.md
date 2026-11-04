# Launch authentication and presentation plan

Goal: preserve existing Supabase accounts while adding Google/X OAuth and fixing login, sign-out and recovery URLs; refine existing public and Settings surfaces.
Architecture: Supabase SSR PKCE callback at /auth/callback and email-token confirmation at /auth/confirm, fixed allowlisted destinations, shared route policy and logout action. Current bearer-verified APIs and ownership rules remain authoritative. No replacement identity service or new paid dependency.

- [x] Add failing route-policy, callback and logout tests: signed-out protected links -> /login; signed-in login -> /overview; recovery retains its page; malicious next/forwarded hosts cannot redirect off-site; failed exchange has no session success; failed logout retains the account; successful logout clears memory and moves to /login.
- [x] Implement lib/auth-navigation.ts, lib/auth-callback.ts, lib/auth-actions.ts and app/auth/callback/route.ts. Use provider google/x (OAuth2), same-origin callback, server cookie exchange, no-store responses, no raw error/token leakage.
- [x] Wire ProductSession routing with auth-change events and stale getSession race protection. Add /reset-password without workspace navigation. Canonical home is /overview. Keep direct authenticated research links.
- [x] Add social buttons for registration/login, provider-error messaging, accessible busy states, independent email recovery. Share the logout action across sheet and Settings.
- [x] Modernize Settings into account/security, appearance, research and help sections; retain existing preferences. Refine the public hero and mobile access without invented results/testimonials or unverified pricing promises. Preserve PWA shell geometry and monthly-v4 work.
- [x] Run full tests, types, production build, compiled API checks. Document exact auryninvest.com redirects, provider credentials and remaining launch security findings. Do not claim live OAuth success without provider configuration and a completed consent roundtrip.
- [x] Package complete source, verification and deployment instructions; no force push, live schema changes or new subscription purchases.

Review focus: expired/cancelled callback; login refresh vs SIGNED_OUT races; browser back after logout; password recovery vs ordinary sign-in; narrow screens and dark-theme controls. Existing API identity tests continue to cover cross-account access.
