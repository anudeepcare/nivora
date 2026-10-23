# Stripe update

After deploying, follow `STRIPE_SETUP.md` for the new migration and Stripe price, webhook and portal setup. Existing API/auth/provider configuration is preserved.

# Git and Vercel instructions

For Google/X authentication and the purchased domain, complete `docs/LAUNCH_AUTH_SETUP.md` before public launch. This code does not configure provider secrets or external dashboards automatically.

## Update the merged nivora app

The product branch was merged into `main` in PR #1 (merge commit `6e6b97ef80c42b1a3ac0d505b0ff3e5daea1e1d6`). The app is at the repository root. Do not run `cd product` on your Mac.

If you already extracted and copied the new source into `~/Downloads/AURYN`, run:

```sh
cd ~/Downloads/AURYN &&
npm ci --include=dev &&
npm run verify &&
npm run test:api &&
git add -A &&
(git diff --cached --quiet || git commit -m "Expand AURYN research, comparisons, DCA and holdings briefing") &&
git push origin main
```

This assumes you are already on `main`, as in your last deployment. `git status -sb` shows the current branch. A clean working tree does not prevent the final push. If Git rejects the push, preserve the local changes and inspect the remote difference; do not force-push or reset branch history.

If you have only downloaded the ZIP, first extract its `AURYN` contents into the existing project folder. Keep your existing Git repository and private environment settings. The ZIP contains the full standalone source, dependency lockfile, tests and deployment documentation; it excludes installed dependencies, generated Next output and secret keys. No source belongs in a nested `product` directory on your Mac.

The optional `scripts/apply-source.cjs` installer validates the archive manifest and makes a sibling source backup before replacing files. Use it only when replacing a legacy folder wholesale; it is unnecessary when you already copied this source. Do not reintroduce removed legacy CSS or old generated `.next` route types.

## Vercel preview

For the merged app use **Root Directory: .**, Next.js, Node 24, install `npm ci`, and build `npm run build`. Review the branch preview before promoting a production build.

1. Set the names from `.env.example` in the correct environment. Preview builds need the Supabase URL, publishable key, provider keys and SEC contact identity too; Production-only variables do not reach branch previews. Supabase URL/publishable key are public; service-role and broker keys are server-only.
2. Apply all SQL files in `supabase/migrations/` in numeric order to a staging project first. The baseline uses `create table if not exists`; inspect existing schemas and policies before production migration. No destructive reset is required.
3. Add the exact preview host to Supabase Auth site/redirect settings. Test registration, verification, login, logout, reset and password update with a dedicated account. Confirm one account cannot access another account's documents, holdings or observations.
4. Set `AURYN_ENABLE_PREVIEW=false`, `AURYN_AI_ENABLED=false`, `AURYN_PAPER_EXECUTION_ENABLED=false`, `AURYN_PAPER_SCHEDULE_ENABLED=false` initially.
5. Before a multi-user launch, configure the service-role key and provider-budget migration, and set `AURYN_REQUIRE_DISTRIBUTED_BUDGET=true`. Verify distribution and provider display permissions. No service-role key was available in the build session.

## Keep both provider keys

Set **EODHD_API_KEY** and **TWELVE_DATA_API_KEY** in Vercel → nivora → Settings → Environment Variables for the intended Preview and Production environments. Neither name has NEXT_PUBLIC_. Redeploy after changing environment variables; an existing deployment will not acquire a new value automatically. You have reported configuring EODHD already; keep it in place. Do not paste secret values into chat or commit them.

The app prefers EODHD for quotes, intraday and daily history, with Twelve Data fallback. During scheduled US pre/regular/post hours, an aging primary quote can trigger a newer backup check. Settings shows which keys are configured; that label does not prove successful authorization. Open APP, HIMS, OSCR, IREN, ASTS, SAP, BTC and ETH in the preview, check displayed source timestamps and financial periods, and inspect any per-dataset error. EODHD fallback prices are explicitly delayed/indicative. No extra plan is needed to run the code; individual dataset entitlement remains to be checked.

## Connected database setup record

On October 17 the seven original SQL files were checked against this branch, rehearsed in a rolled-back transaction, and installed on `nivora` as migration `20261017070956_auryn_product_workspace_setup`. Explicit permissions were installed as `20261017071243_auryn_product_explicit_grants`; that migration is included in source. Existing portfolio and watchlist records were preserved. All 31 live rollback-only database checks passed.

Do not rerun the seven baseline files on that connected project: their policies already exist. The remote migration history records the baseline as one aggregate entry, not seven source filenames. Reconcile CLI migration history before using an automatic `supabase db push` workflow. For a fresh project, apply the source SQL files in numeric order. See `verification/LIVE_SETUP.md` for the evidence and remaining acceptance limits.

## Paper configuration

Set the authenticated owner's exact UUID as `AURYN_PAPER_OWNER_ID`; grant trusted admin through `app_metadata.role=admin` or `AURYN_ADMIN_USER_IDS`. Never use editable `user_metadata`. Set paper credentials only. The endpoint is fixed to Alpaca paper and cannot be redirected to real-money trading through an environment variable.

Save a paused whole-share plan in Paper trading, inspect shares, limit price, cash reserve and position cap, then arm it. Execution requires the separate deployment flag. Test a small authorized paper plan in staging, verify the exact broker client order ID, partial fill/cancel/reconcile behavior and audit log before scheduling. A plan can run once per UTC calendar month. A validation failure after reservation consumes that plan/month; create a reviewed replacement plan if required.

For scheduled checks, set a random `CRON_SECRET` of at least 32 characters, `AURYN_ALERT_JOB_USER_ID`, and the paper-owner/flags if wanted. `/api/jobs` uses `Authorization: Bearer <CRON_SECRET>`. The workflow is manual by default. Configure its protected `auryn-paper` environment, `AURYN_APP_URL` variable and matching secret, verify it manually, then add a schedule appropriate to your hosting allowance. Avoid duplicate GitHub/Vercel schedulers.

Uncertain submissions keep the account lock until reconciled. Do not retry with a new ID. Pausing plans does not cancel open orders; use the individual cancellation action.

## Acceptance before promotion

Run the checks, then capture actual desktop and mobile light/dark screens, including 320/375/390/430, tablet and 1280/1440/1920 widths. Review against `docs/design/approved-studio-20261017.html`; earlier references remain historical context. Test all tabs, search, sources, dialogs, error states, alerts, chart ranges/scrolling, theme persistence, browser back/forward and installed iPhone PWA safe areas. Test latency under the existing provider budget. Review the unimplemented scope in `RELEASE_STATUS.md` before selling access.
