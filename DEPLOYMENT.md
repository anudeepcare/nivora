# GitHub and Vercel deployment

## October 16 premium product update

The premium interface, personal research home, quote repairs and exploratory valuation workbench require no additional environment variable, subscription or migration. Rebuild from this source package. Extract its `AURYN` contents into the existing Git checkout, including hidden configuration/workflow templates, while retaining your `.git` history and private `.env.local`. Downloading or unzipping alone does not update GitHub.

From the owner's existing checkout:

```sh
cd /Users/anudeeppaleru/Downloads/AURYN
npm ci
npm run verify:release
git status --short
git add -A
git add -f .github/workflows/auryn-v996-validation-queue.yml .github/workflows/nivora-calibration-mature.yml
git commit -m "AURYN mobile-first research and portfolio redesign"
git push origin main
```

Run the Git commands only after a successful verification and diff review. Vercel must build the pushed commit with the real environment settings; this ZIP has not been deployed by this session. Read `verification/VERIFICATION_REPORT.md` and `PREMIUM_UX_RELEASE.md` for current test scope and limitations. Earlier prerequisites below remain relevant.

## October 15 research update

The previously delivered rebuild was observed on GitHub main at `f6a08231a8dc7e1fff4dfc5f9772ce297ea88843`. This package contains subsequent research/data/mobile fixes; those new changes have not been pushed or deployed by this session. Use the existing repository and review the diff before merging. No new paid provider is required by these changes.

Set server-only `SEC_USER_AGENT` to an identifying application/contact string for SEC requests. The new `sec-company-evidence-v3` contract invalidates older company snapshots in the browser. No database migration is introduced by this product research update; the earlier paper-order migration below remains necessary for that feature.

## Current release status

See `verification/LIVE_READINESS.md` for actual service observations. Supabase anonymous access and two-user read isolation, Alpaca Paper connectivity, Finnhub, and Twelve Data stock/crypto quotes have been checked. Deployment of the rebuilt source, actual login/email/CRUD and an intended paper submission/fill/cancel still require acceptance. The manual audit schema/admin setup, broker protection settings and extended-hours entitlement need attention. Current acceptance is the blocking build/test gate; unchanged historical contracts remain separately reported in `verification/RELEASE_TEST_POLICY.md`.

## Supabase and authentication

1. Use the existing AURYN Supabase project. Back up data before applying migrations. The `supabase/` directory contains the original schema and incremental SQL; inspect which versions are already installed rather than replaying every file blindly.
2. For the new manual paper-order ticket, apply `supabase/auryn_manual_paper_orders.sql`. It adds an audit table with RLS, owner-only reads and service-role-only writes, plus lifecycle observation/cancellation columns and an owner/history index. Reapply this idempotent file when upgrading an earlier manual-ticket installation. It does not change investment weights or trading automation.
3. Set Supabase Auth Site URL to your actual site. Allow `/auth/callback` for production and preview URLs that you control. Email confirmation redirects to `/auth/callback?next=/onboarding`; password recovery uses `/auth/callback?next=/reset-password`.
4. Enable Google/Apple OAuth in Supabase if those sign-in methods are offered. Provider configuration, consent screens and email delivery must be tested in the actual project.
5. Configure `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` before building. Keep the service-role key server-only. Never commit `.env.local`.
6. Set trusted administrator UUIDs in `AURYN_ADMIN_USER_IDS`, or assign `app_metadata.role=admin` through trusted server administration. Editable `user_metadata` is not an authorization source. Trading Lab controls the shared deployment paper account and is deliberately admin-only.

## Market data and paper trading

Use the environment-variable template and `verification/route-inventory.json` for the inventory. Twelve Data, Finnhub, MarketData.app, Alpaca and optional OpenAI integrations retain the source contracts. Validate actual vendor access, BTC/USD, pre/regular/post-market timestamps and fallback behavior after configuration. The 55/minute provider ceiling and 42/minute background allocation remain in the existing job scheduler.

Alpaca credentials must belong to **Paper Trading**. Broker requests remain fixed to `https://paper-api.alpaca.markets`; there is no configurable live-money base URL. Leave `TRADING_LAB_PAPER_ENABLED=false` until the deployment is configured and verified.

For manual paper orders, the account configuration must report `no_shorting=true`, `max_margin_multiplier="1"`, and no trading suspension. Configure these intentionally in Alpaca Paper; AURYN only reads them and will not change them. These broker protections apply to the shared account, including concurrent automated activity. The ticket additionally requires fresh regular-session execution data, whole shares, available cash/buying power, available owned shares for sells, a limit within 2% of the verified quote and a buy no larger than 10% of equity. Only day limit orders are supported; market orders are intentionally not offered.

The UI requires review before submission. A UUID is claimed in audit storage before transmission. Repeated requests reuse that identity. Uncertain results stay blocked for reconciliation; verify Alpaca before placing a replacement order. Opening or refreshing manual history reconciles owned audit records with the broker, including uncertain submissions by their original client order ID. It shows cumulative fills and the last verification time. Cancellation requires its own review/confirmation and a durable audit claim; requesting cancellation never promises the unfilled remainder cannot fill. Uncertain cancellation attempts are not automatically resent. Check Alpaca Paper if reconciliation remains inconclusive. This is on-demand reconciliation, not a continuous worker. Automated strategy evaluations remain separate.

Alpaca reference: https://docs.alpaca.markets/us/reference/patchaccountconfig-1 and https://alpaca.markets/sdks/python/api_reference/trading/models.html . These were consulted for configuration fields; no broker configuration or order was changed during this rebuild.

## GitHub workflows

Preserve `.github/workflows/auryn-v996-validation-queue.yml` and `.github/workflows/nivora-calibration-mature.yml`, along with the other existing workflows. Configure repository secrets as named in those files, including `TRADING_LAB_CRON_SECRET` where used and `CRON_SECRET` for portfolio learning. Do not rename secrets globally: different retained workflows intentionally use their existing contracts. Configure the deployment base URL expected by each workflow.

The supplied `vercel.json` is `{}`. The current source uses GitHub schedules; old V9.9.0 tests expecting Vercel cron entries conflict with later Hobby-compatible source. Do not enable duplicate schedules simply to satisfy an obsolete test.

## Build and GitHub review

Run from the unpacked `AURYN` directory. Supply the actual public Supabase environment before building. The package includes a blocking acceptance/build workflow and a clearly labelled advisory historical job.

```sh
npm ci
npm run verify:release
# Optional comparison; unchanged historical assertions include known failures:
npm run test:historical
```

Copy the package contents into a review branch of the existing repository, including `.github/workflows` and `.env.example`. Keep your actual environment files private. Review the source diff and verification results, then commit/push the branch and open a pull request. Use a Vercel preview for configured acceptance before merging to the production branch. This package does not push commits or modify branch protection for you.


## Vercel

Import the existing GitHub repository, select Next.js, use the project root, install with `npm ci` and build with `npm run build`. Select Node 22 LTS. Add server/public environment variables to the intended environments, then rebuild: public Supabase variables are compiled into browser bundles. Use your actual domain in `app/layout.tsx` metadata if different from the retained getauryn.vercel.app address.

Verify a preview deployment first: signup and email verification, login, password recovery, OAuth callbacks, onboarding persistence, two-user RLS isolation, portfolio/watchlist/alert CRUD, actual quotes with provenance, every research tab and paper status. Verify empty/error/stale/closed-market states. Run paper submission only with an explicitly intended simulated order. Confirm scheduled jobs and provider rate limits from real logs. No such external verification is claimed here.

## Reproducing offline browser checks

Install Playwright in a development environment (`npm install --no-save playwright` and `npx playwright install chromium`). Build with the public fixture configuration shown in `verification/BROWSER_TESTS.md`, start the local server, then run the applicable browser scripts. For this update, run `node verification/premium-global-browser.cjs` and `node verification/premium-research-browser.cjs`; these check application routes and the 11 research tabs across mobile/desktop widths and both themes. Run `node verification/premium-interactions.cjs` for personal workspace interactions and `node verification/premium-company-browser.cjs` for scenario editing and blocked financial-evidence states. Supply `PLAYWRIGHT_MODULE_PATH` only if Playwright is installed outside the project, and `CHROMIUM_EXECUTABLE_PATH` only for a custom browser executable. Never deploy a fixture-configured build. Rebuild with real public environment variables for deployment.
