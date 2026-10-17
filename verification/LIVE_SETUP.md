# Live deployment setup verification — October 17, 2026

Scope: `anudeepcare/nivora`, review branch `auryn-product-20261017`; no merge or production promotion performed.

## Changes completed

- Enabled the existing Supabase publishable key and SEC contact identity specifically for this preview branch. Production values were not changed.
- Vercel deployment `dpl_9E9MYbivHVxYgNZnAX4pwL8TwuZr` reached READY for source commit `df6bc016e608f11802ad22b159ca88d0f87bca2b`.
- Verified all seven baseline migration blobs match the deployed GitHub source and existing portfolio/watchlist schema. Rehearsed migration SQL in a rolled-back transaction before applying it.
- Installed baseline database objects as migration `20261017070956_auryn_product_workspace_setup` on Supabase project `culqkfmyqfpcuklonnog`.
- Installed migration `20261017071243_auryn_product_explicit_grants` to remove inherited anonymous/client privileges from new tables and enable RLS on private bookkeeping tables. Authenticated writes remain restricted by account policies; paper plans and runs are server-controlled.
- Changed `typecheck` to generate Next route definitions before TypeScript, preventing the stale generated-route failure encountered on the user's machine.

## Executed checks

- **31 live PostgreSQL checks passed**, using `live-database-smoke.sql`: own-account writes, cross-account reads/inserts, watchlist membership, immutable observations, alert read state, replay-safe imports, changed-payload rejection, AI quotas, private schema isolation, server-only paper reservation, unresolved-order locking, repeated-month rejection, paused-plan rejection and explicit privilege boundaries.
- All synthetic accounts and rows were rolled back; subsequent query found **zero test accounts**.
- Existing records remained **43 portfolio positions, six watchlists and 23 watchlist items** before and after setup.
- All **44 local tests passed** (`setup-test.log`), including the PGlite regression with broad Supabase-style default grants enabled, followed by the explicit-grants migration.
- `npm run typecheck` passed with route generation enabled.
- Direct SEC ticker lookup and AppLovin companyfacts returned HTTP 200; AppLovin's response contained 372 US-GAAP tags. This verifies provider reachability, not the deployed authenticated UI response.
- **Zero broker requests and zero paid AI calls** were made during verification.

## Remaining limits

The user screenshot demonstrates a signed-in research page. Automated protected-preview access and build-log access returned 403 from the Vercel connector. Browser interactions, rendered chart behavior, recovery, iPhone PWA layout, and end-to-end authenticated API writes remain unverified here. Preview service-role and paper-owner/broker settings remain unconfigured; no paper execution or scheduling was enabled.

Supabase security advisors still report legacy callable SECURITY DEFINER functions and disabled leaked-password protection. The new `auryn_import_positions` and `auryn_reserve_ai_request` functions are intentionally callable by authenticated users, validate account identity, and passed permission tests. Private bookkeeping and paper-lock tables intentionally have no client RLS policies. Review legacy warnings separately: https://supabase.com/docs/guides/database/database-linter

This setup repair does not complete all inherited product requirements; `docs/RELEASE_STATUS.md` remains the product acceptance record.

GitHub rejected the source follow-up write with HTTP 403 (`Resource not accessible by integration`). The database and Vercel configuration changes are live; the source follow-up is included in this updated ZIP for the owner to commit and push through their working Git credentials. The deployed branch still points to `df6bc016e608f11802ad22b159ca88d0f87bca2b` until that push.
