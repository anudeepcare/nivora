# Customer authentication plan

Status: customer auth implemented and locally contract-tested; not connected to production; no deployment performed.

Read-only Vercel metadata on 2026-11-17 shows a single
`NEXT_PUBLIC_SUPABASE_URL` record targeted to both `production` and `preview`.
Therefore the preview target is **not isolated**. No live signup, recovery, password
change, RLS test, or customer-data write may be run there as an isolation test.

## Replaced defect

The former browser gate was an operator-only mechanism, not customer authentication:

- `src/public/app.js` now renders customer login, signup and recovery states; it never asks for a provider or operator key.
- `src/server/customer-auth.js` performs login, signup, recovery, refresh, identity verification and logout through the configured Supabase Auth boundary.
- Access and refresh tokens are confined to HttpOnly SameSite cookies and are never returned in browser JSON or stored in browser storage.
- Protected provider APIs fail closed without a verified customer session. Same-origin write checks and per-client limits remain enabled.
- Existing browser-local settings, watchlist, portfolio and cash data remain intact across the UI change; account-backed synchronization is not enabled yet.

The old shared operator-key gate is no longer part of the customer UI or startup path.

## Required customer boundary

### Public routes

- `/` — public storefront
- `/product` or `/sample` — product guide
- `/pricing`
- `/help`, `/about`, `/methodology`, `/terms`, `/privacy`, `/risk`
- `/login`, `/signup`, `/forgot-password`
- `/auth/callback` — allowlisted OAuth/email confirmation callback

These routes must render without provider credentials or an authenticated session.

### Protected routes

- `/app/today`
- `/app/research`
- `/app/discover`
- `/app/compare`
- `/app/watchlist`
- `/app/portfolio`
- `/app/settings`

Unauthenticated access returns a same-origin redirect to `/login?next=<allowlisted path>`. External or nested redirect targets are rejected.

## Fresh implementation architecture

Use Supabase Auth through a same-origin server boundary. Do not copy production application code.

1. Configure only the Supabase project URL and publishable key at the server boundary. Never expose a service-role key.
2. Exchange credentials and refresh sessions server-side through the documented GoTrue REST contract.
3. Apply `cache-control: no-store` whenever auth/session JSON or refreshed cookies are written.
4. Verify the current user through `/auth/v1/user`; refresh once when an access token is expired.
5. Preserve same-origin/CSRF checks for cookie-authenticated writes.
6. Sign-out ends the current browser session deliberately.

The browser UI must support:

- email/password sign in;
- account creation with email verification;
- forgot/reset password;
- configured OAuth providers only;
- session expiry recovery without allowing a late response to overwrite the login screen;
- explicit sign out;
- accessible error, loading, and resend states.

## User data and authorization

Customer identity is necessary but not sufficient. Every persisted user record must contain an immutable `user_id` and use Row Level Security.

For every exposed customer table:

- enable RLS;
- grant only the required operations to `authenticated`;
- use `USING ((select auth.uid()) = user_id)` for reads/deletes;
- use both `USING` and `WITH CHECK` for updates;
- never authorize from user-editable `user_metadata`;
- keep service-role access server-only and out of ordinary customer request paths.

Initial account-scoped tables should cover workspace preferences, watchlist, portfolio transactions, cash balance, saved comparisons, and research notes. Provider cache/quota state remains server-owned and must not be readable as customer data.

## Environment isolation

The existing production Vercel project has Supabase configuration in production and preview scopes. That proves the current product has an auth backend; it does not authorize the fresh build to share the production customer database.

The account owner subsequently confirmed that the fresh build should use the existing Vercel-managed integrations. Metadata-only inspection (no decrypted values) confirms these relevant variables exist:

- `SENTISENSE_API_KEY`
- `EODHD_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; forbidden from browser bundles and ordinary customer request paths)
- Stripe and Resend variables for billing and transactional email

The secret values are intentionally not retrievable through the connector. They can be injected natively only when the fresh build runs in an authorized Vercel environment with those scopes. No key should be copied into chat, source, logs, screenshots, URLs, or a ZIP.

Safe sequence:

1. Run the fresh build only as a protected non-production Vercel preview that receives the existing preview-scoped variables natively.
2. Confirm whether the preview Supabase URL points to an isolated branch/project or the production customer database before enabling signup or writes.
3. Apply reviewed RLS migrations to that isolated environment.
4. Test signup, verification, login, refresh, recovery, logout, CSRF, cross-account isolation, and session expiry.
5. Decide explicitly whether launch uses new accounts or a reviewed migration from the existing product.
6. Only after that decision, configure a protected preview. Production remains unchanged until a separate cutover approval.

## Acceptance gates

- Public pages and menus work without any access key.
- Provider APIs make zero calls before authentication and feature intent.
- Two test accounts cannot read or modify each other's rows, including through direct Data API calls.
- Restarting or changing serverless instances does not invalidate a valid customer session.
- OAuth and recovery reject unallowlisted redirect destinations.
- No service-role key, provider key, refresh token, or customer credential appears in HTML, browser storage logs, URLs, source, screenshots, or test fixtures.
- The local operator API key never appears as a customer-facing login option.

## Current blocker

Credential availability is not the blocker: the required SentiSense, EODHD and Supabase variable names exist in Vercel. The remaining blocker is safe execution scope. Live auth/provider verification requires an authorized protected preview that receives the variables natively. Before enabling account-data writes or migration, the Supabase target must be confirmed as isolated or explicitly approved as the shared account system. Production remains unchanged. No additional market-data provider was added.
