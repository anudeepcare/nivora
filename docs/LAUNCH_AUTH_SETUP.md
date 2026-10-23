# Launch setup — auryninvest.com

Code is integrated. Google/X consent flows, email delivery and domain settings are not activated by copying source alone. No provider credentials were requested in chat or stored in this package.

## Current provider availability

The supplied dashboard screenshot shows Google and X OAuth2 enabled. Public Auth settings expose Google true but omit X; absence is not evidence that X is disabled. The corrected application allows an ordinary X sign-in attempt when the field is absent. Do not re-enter credentials solely because the previous source displayed “X sign-in is not enabled.” Read `LANDING_AND_X_AVAILABILITY.md` for the source fix. The provider endpoint is no-store and upstream settings are cached for at most 60 seconds. A completed live consent roundtrip remains to be tested.

## Domain and Supabase

1. In Vercel, connect `auryninvest.com` to the existing project, confirm HTTPS and select it as the canonical host. Redirect `www.auryninvest.com` to the apex. Keep the current Vercel address available until the domain works.
2. In the existing **nivora** Supabase project, Authentication > URL Configuration, set Site URL to `https://auryninvest.com`.
3. Add exact redirect URLs (avoid a production `/**` wildcard):
   - `https://auryninvest.com/auth/callback`
   - `https://auryninvest.com/auth/callback?next=/reset-password`
   - `https://auryninvest.com/auth/confirm`
   - `https://getauryn.vercel.app/auth/callback` and its `?next=/reset-password` variant only while that host is supported.
4. Keep production public Supabase URL/key pointing to this same project; existing accounts and holdings are preserved. Provider secrets belong in Supabase provider configuration, not NEXT_PUBLIC variables or frontend code.

## Google

Create/configure a Google Cloud OAuth **Web application** for AURYN. Configure the consent screen, support contact, authorized domain `auryninvest.com`, privacy and terms URLs; move from test mode when ready. Add `https://auryninvest.com` as an authorized JavaScript origin. The Google authorized redirect URI is the Supabase callback, **not** the application callback:

`https://culqkfmyqfpcuklonnog.supabase.co/auth/v1/callback`

Enable Google in Supabase Authentication > Sign In / Providers and enter that application's client ID and secret. The app uses provider `google`, same-origin `/auth/callback`, one-time PKCE code exchange and cookie persistence. Finish Google's own publishing/verification requirements as applicable.

## X

Create/configure an X developer application for AURYN with **OAuth 2.0**, Web App type, minimal sign-in access and email access as supported. Set the same Supabase callback URI shown above, website `https://auryninvest.com`, Terms `/terms` and Privacy `/privacy`.

Enable **X / Twitter (OAuth 2.0)** in Supabase and add the OAuth 2 client ID/secret. This application uses provider `x`, not legacy OAuth1 `twitter`. Account permissions/cost depend on X's current developer offering; no paid plan was purchased or assumed. Request no posting or investment/trading permission.

Google/X sign-in also creates an account when needed. Provider identities shown in Settings are read from Supabase, not a claim that buttons are configured. Do not manually merge account UUIDs or migrate holdings to match an unverified email. Verify existing-email linking and no-email X behaviour with dedicated test accounts.

## Email confirmation and password recovery

For production visitors outside your Supabase team, configure a real SMTP sender and authenticated sending domain. Verify delivery, spam placement and rate limits. The default Supabase sender is not a general public-launch mail service.

To avoid requiring the same browser for emailed PKCE links, use these Supabase email template link targets:

- Confirm signup: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`
- Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery`

Do not reuse these templates for invitations, email changes or arbitrary OTP types: those flows are not implemented by this confirm handler. The handler verifies the one-time hash, sets session cookies, removes the sensitive URL via redirect and chooses only `/overview` or `/reset-password`. PKCE `/auth/callback` remains available for OAuth and existing same-browser email redirects. Review link-scanner/email-provider behaviour; one-use links may be consumed if a scanner visits the actual verification URL.

A link opened in Safari and an installed iPhone PWA can have separate browser sessions. Successful Safari consent does not prove the installed PWA is authenticated. Test the installed workflow explicitly; no physical-iPhone acceptance is claimed.

## Routing behaviour

| Action | Result |
|---|---|
| Signed-out protected page | Replace URL with `/login`; no workspace shell |
| Email sign-in, immediate signup session or successful social callback | `/overview`, Home selected |
| Signed-in direct research/portfolio link | Keep that requested page |
| Signed-in visit to `/login` | `/overview` |
| Password recovery | `/reset-password`, no workspace menu |
| Sign out succeeds | Revoke session, clear in-memory account data, full location replacement to `/login` |
| Sign out fails | Display failure; do not pretend the account was revoked |
| Cancelled/expired callback | Clean login URL with a fixed error message; no provider diagnostics or tokens |
| Browser back-forward cache restores an account page | Reload the document and evaluate current session |

API ownership checks continue to verify the bearer with Supabase `getUser`; client redirects are presentation, not authorization. Supabase sign-out revokes refresh sessions, but an already-issued access JWT can remain valid until expiry. Use appropriate JWT expiry; this patch does not add a server-side token-denylist or certify immediate revocation of every issued bearer.

## Launch security findings — not silently fixed in production

A read-only check of the existing nivora project found four legacy SECURITY DEFINER functions callable by anon, six callable by authenticated, and leaked-password protection disabled. Source does not use the three legacy backend helpers named in `docs/sql/LAUNCH_ACCESS_HARDENING.sql`; inspect any separately deployed legacy workers before applying that script. The new source retains intentional authenticated AI-budget/import RPCs with their ownership checks. RLS-enabled/no-policy notices for backend-only tables are not a reason to make those tables public.

- Review/apply `docs/sql/LAUNCH_ACCESS_HARDENING.sql` in staging, then production; it revokes direct application-role access to the four inspected legacy helpers and retains service-role execution. It does not delete records or rewrite the signup trigger.
- Enable leaked-password protection if supported by the current Supabase plan; otherwise document the limitation. Review password length, Auth rate limits, email verification and abuse protection before opening registration.
- Set the actual operator name and support address using the existing legal environment variables. Review terms, privacy, provider display/distribution rights and actual product claims before selling subscriptions. This patch does not activate billing or certify legal compliance.

Remediation references: [privileged anonymous functions](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable), [signed-in privileged functions](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password security](https://supabase.com/docs/guides/auth/password-security).

## Acceptance before opening registration

With dedicated accounts: new/existing Google and X users; cancelled consent; expired/replayed links; duplicate-email handling; email signup/verification; recovery on same and another browser; sign-out on every primary tab; browser back after sign-out; direct deep links; repeated login; separate-account isolation. Review Settings/public/login/recovery at narrow/mobile/desktop widths and in light/dark modes. Run `npm run verify` and `npm run test:api` before pushing. Full source and earlier monthly-v4 changes are retained; there is no new market-data endpoint spend.

Official implementation references, checked 23 October 2026: [Google](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [X OAuth2](https://supabase.com/docs/guides/auth/social-sign-in/auth-twitter), [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp). The relevant October TLS-cipher deprecation affects old TLS clients; this implementation uses current browser/Node HTTPS and does not change TLS settings.
