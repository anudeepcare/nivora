# Git and Vercel instructions

## Update the merged nivora app

The product branch was merged into `main` in PR #1 (merge commit `6e6b97ef80c42b1a3ac0d505b0ff3e5daea1e1d6`). The app is at the repository root. Do not run `cd product` on your Mac.

Download the latest `AURYN-full-source-handoff.zip` to Downloads, replacing the earlier download with that exact filename. Stop any local development server first. Run this in your existing folder:

```sh
cd ~/Downloads/AURYN &&
git switch main &&
git fetch origin &&
git branch "backup-auryn-$(date +%Y%m%d-%H%M%S)" &&
unzip -p "$HOME/Downloads/AURYN-full-source-handoff.zip" AURYN/scripts/apply-source.cjs > "$HOME/Downloads/auryn-apply-source.cjs" &&
node "$HOME/Downloads/auryn-apply-source.cjs" "$HOME/Downloads/AURYN-full-source-handoff.zip" &&
npm ci &&
npm run verify &&
npm run test:api &&
git reset --soft origin/main &&
git add -A &&
(git diff --cached --quiet || git commit -m "Apply approved AURYN HTML design and ticker repairs") &&
git push origin main
```

The installer validates archive integrity and every source checksum before changing the app. It moves previous source, legacy tests/workflows and generated files into a sibling `AURYN-source-backup-…` folder and prints that backup location. It installs only the source listed in the package. It preserves `.git`, `.env`, `.env.*` (except the sample template) and `.vercel`. It does not modify Supabase, deployment settings or broker accounts. The archive excludes credentials, installed dependencies and generated build output.

Do not use `unzip -o` over the application: it leaves obsolete files in place and caused the mixed-source test failure. If verification fails, the command chain stops before changing the Git base or pushing. The backup folder retains the previous files.

The local and remote repositories previously had unrelated histories. After verification, `git reset --soft origin/main` keeps the installed working files and makes the new commit a normal child of the fetched remote `main`. The backup branch retains the previous local commits. The final push does not use force. This intentionally replaces the remote application source with the tested package; review any unrelated remote edits before running it. If the remote changes again during verification, fetch and review that change before retrying.

`verify` regenerates Next route types before TypeScript checking, then runs a production build. Do not manually edit `.next/types/validator.ts`. If a previous development process is still running, stop it before verifying so it cannot regenerate stale route types during the build.

A failed command stops the chain. The conditional commit handles an already-current working tree without preventing the push. Do not force-push or merge unrelated histories to work around an installation error.

The current CI workflow is `auryn-product-verify.yml`. Historical workflows are moved to the source backup by the installer. Do not restore old schedules against replacement endpoint contracts without reviewing them.

## Vercel preview

For the merged app use **Root Directory: .**, Next.js, Node 24, install `npm ci`, and build `npm run build`. Review the branch preview before promoting a production build.

1. Set the names from `.env.example` in the correct environment. Preview builds need the Supabase URL, publishable key, provider keys and SEC contact identity too; Production-only variables do not reach branch previews. Supabase URL/publishable key are public; service-role and broker keys are server-only.
2. Apply all SQL files in `supabase/migrations/` in numeric order to a staging project first. The baseline uses `create table if not exists`; inspect existing schemas and policies before production migration. No destructive reset is required.
3. Add the exact preview host to Supabase Auth site/redirect settings. Test registration, verification, login, logout, reset and password update with a dedicated account. Confirm one account cannot access another account's documents, holdings or observations.
4. Set `AURYN_ENABLE_PREVIEW=false`, `AURYN_AI_ENABLED=false`, `AURYN_PAPER_EXECUTION_ENABLED=false`, `AURYN_PAPER_SCHEDULE_ENABLED=false` initially.
5. Before a multi-user launch, configure the service-role key and provider-budget migration, and set `AURYN_REQUIRE_DISTRIBUTED_BUDGET=true`. Verify distribution and provider display permissions. No service-role key was available in the build session.

## Connected database setup record

On October 17 the seven original SQL files were checked against this branch, rehearsed in a rolled-back transaction, and installed on `nivora` as migration `20261017070956_auryn_product_workspace_setup`. Explicit permissions were installed as `20261017071243_auryn_product_explicit_grants`; that migration is included in source. Existing portfolio and watchlist records were preserved. All 31 live rollback-only database checks passed.

Do not rerun the seven baseline files on that connected project: their policies already exist. The remote migration history records the baseline as one aggregate entry, not seven source filenames. Reconcile CLI migration history before using an automatic `supabase db push` workflow. For a fresh project, apply the source SQL files in numeric order. See `verification/LIVE_SETUP.md` for the evidence and remaining acceptance limits.

## Paper configuration

Set the authenticated owner's exact UUID as `AURYN_PAPER_OWNER_ID`; grant trusted admin through `app_metadata.role=admin` or `AURYN_ADMIN_USER_IDS`. Never use editable `user_metadata`. Set paper credentials only. The endpoint is fixed to Alpaca paper and cannot be redirected to real-money trading through an environment variable.

Save a paused whole-share plan in Paper trading, inspect shares, limit price, cash reserve and position cap, then arm it. Execution requires the separate deployment flag. Test a small authorized paper plan in staging, verify the exact broker client order ID, partial fill/cancel/reconcile behavior and audit log before scheduling. A plan can run once per UTC calendar month. A validation failure after reservation consumes that plan/month; create a reviewed replacement plan if required.

For scheduled checks, set a random `CRON_SECRET` of at least 32 characters, `AURYN_ALERT_JOB_USER_ID`, and the paper-owner/flags if wanted. `/api/jobs` uses `Authorization: Bearer <CRON_SECRET>`. The workflow is manual by default. Configure its protected `auryn-paper` environment, `AURYN_APP_URL` variable and matching secret, verify it manually, then add a schedule appropriate to your hosting allowance. Avoid duplicate GitHub/Vercel schedulers.

Uncertain submissions keep the account lock until reconciled. Do not retry with a new ID. Pausing plans does not cancel open orders; use the individual cancellation action.

## Acceptance before promotion

Run the checks, then capture actual desktop and mobile light/dark screens, including 320/375/390/430, tablet and 1280/1440/1920 widths. Compare them to `docs/design/approved-interactive.html`; missing reference screens must receive direct usability review. Test all tabs, search, sources, dialogs, error states, saved notes, alerts, chart ranges/scrolling, theme persistence, browser back/forward and installed iPhone PWA safe areas. Test latency under the existing provider budget. Review the unimplemented scope in `RELEASE_STATUS.md` before selling access.
