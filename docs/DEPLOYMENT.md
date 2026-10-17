# Git and Vercel instructions

## Existing nivora repository

Extract the ZIP. Copy its application directory into the existing repository as `product/`. It is a standalone app; do not overlay these files onto the old root app. Keep a backup of existing local changes.

From the nivora repository:

```sh
git status --short
git switch -c auryn-product-review
cd product
npm ci
npm run verify
npm run test:api
cd ..
git add product
git diff --cached --stat
git commit -m "Add standalone AURYN research and paper workspace"
git fetch origin
git push -u origin HEAD
```

Use a new unused branch name if that one exists. `HEAD` pushes the branch you are actually on, fixing the earlier `restore-auryn` versus `main` mistake. Never force-push. Open a PR into `main`; resolve incoming changes there. The ZIP does not include your `.git` directory or secrets.

The packaged workflows are inside `product/.github/workflows/` after copying; GitHub only executes workflows at the repository root. To activate the new verification workflow, copy `product/.github/workflows/auryn-product-verify.yml` into root `.github/workflows/` and stage that exact file. Preserve existing workflows unless you deliberately migrate their endpoint contracts. The two historically required workflow files are retained under `docs/historical-workflows/` for comparison; they target the older application and are not silently activated against this replacement. The old instructions to force-add them and blindly push `main` are superseded by this safe branch workflow.

For an entirely new repository where the extracted app itself is the repository root, `git add -A` is appropriate only after confirming `.env.local` is ignored with `git check-ignore .env.local`.

## Vercel preview

Use a separate preview project or branch deployment. In the existing nivora repository select **Root Directory: product**, Next.js, Node 24, install `npm ci`, build `npm run build`. For an extracted app at repository root, Root Directory is `.`. Do not change the live project's root until acceptance is complete.

1. Set the safe names from `.env.example` using the existing provider credentials. Supabase URL/publishable key are public; all other keys, especially service-role and broker keys, are server-only.
2. Apply all SQL files in `supabase/migrations/` in numeric order to a staging project first. The baseline uses `create table if not exists`; inspect existing schemas and policies before production migration. No destructive reset is required.
3. Add the exact preview host to Supabase Auth site/redirect settings. Test registration, verification, login, logout, reset and password update with a dedicated account. Confirm one account cannot access another account's documents, holdings or observations.
4. Set `AURYN_ENABLE_PREVIEW=false`, `AURYN_AI_ENABLED=false`, `AURYN_PAPER_EXECUTION_ENABLED=false`, `AURYN_PAPER_SCHEDULE_ENABLED=false` initially.
5. Before a multi-user launch, configure the service-role key and provider-budget migration, and set `AURYN_REQUIRE_DISTRIBUTED_BUDGET=true`. Verify distribution and provider display permissions. No service-role key was available in the build session.

## Paper configuration

Set the authenticated owner's exact UUID as `AURYN_PAPER_OWNER_ID`; grant trusted admin through `app_metadata.role=admin` or `AURYN_ADMIN_USER_IDS`. Never use editable `user_metadata`. Set paper credentials only. The endpoint is fixed to Alpaca paper and cannot be redirected to real-money trading through an environment variable.

Save a paused whole-share plan in Paper trading, inspect shares, limit price, cash reserve and position cap, then arm it. Execution requires the separate deployment flag. Test a small authorized paper plan in staging, verify the exact broker client order ID, partial fill/cancel/reconcile behavior and audit log before scheduling. A plan can run once per UTC calendar month. A validation failure after reservation consumes that plan/month; create a reviewed replacement plan if required.

For scheduled checks, set a random `CRON_SECRET` of at least 32 characters, `AURYN_ALERT_JOB_USER_ID`, and the paper-owner/flags if wanted. `/api/jobs` uses `Authorization: Bearer <CRON_SECRET>`. The workflow is manual by default. Configure its protected `auryn-paper` environment, `AURYN_APP_URL` variable and matching secret, verify it manually, then add a schedule appropriate to your hosting allowance. Avoid duplicate GitHub/Vercel schedulers.

Uncertain submissions keep the account lock until reconciled. Do not retry with a new ID. Pausing plans does not cancel open orders; use the individual cancellation action.

## Acceptance before promotion

Run the checks, then capture actual desktop and mobile light/dark screens, including 320/375/390/430, tablet and 1280/1440/1920 widths. Compare them to `docs/design/approved-direction.png`; missing reference screens must receive direct usability review. Test all tabs, search, sources, dialogs, error states, CSV replay, saved notes, alerts, chart ranges/scrolling, theme persistence, browser back/forward and installed iPhone PWA safe areas. Test latency under the existing provider budget. Review the unimplemented scope in `RELEASE_STATUS.md` before selling access.
