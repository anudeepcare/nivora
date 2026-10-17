# AURYN UX repair — Git and deployment

This package is based on `bbdce50b92384acefb3db79978423da92a75e1ea` and includes the accumulated AURYN rebuild plus the October 16–17 UX repairs. It has not been pushed or deployed. Read `RELEASE_REPORT.md` and `verification/repair-2026-10-17/VERIFICATION_REPORT.md` first; older reports describe earlier builds. The source includes new and modified files, not just a patch.

## 1. Put the complete source in your existing checkout

Extract the ZIP. Copy the **contents of its AURYN folder** into your existing `nivora`/`AURYN` checkout, including `.github`, `.env.example`, source, migrations, tests and the lockfile. Do not create `AURYN/AURYN`. Keep your existing `.git` and private `.env.local`. The ZIP deliberately contains neither credentials nor installed/build output.

First preserve unrelated local changes on a branch or commit. Check `git status` and `git log -1 --oneline`. If GitHub has commits newer than the baseline above, reconcile those changes before copying; do not overwrite them blindly. The final ZIP contains full source, not only changed files.

## 2. Install and verify

Use a supported Node version (this build was tested on Node 24.19.0). Copy `.env.example` to `.env.local` only if you do not already have one. Fill the Supabase public URL/key privately; existing server keys are required for live integrations. Preserve your existing credentials. Run from the directory containing `package.json`:

```bash
npm ci
npm run verify:release
npm audit --omit=dev
```

`verify:release` runs the complete current acceptance manifest and production build. `test:historical:all` also exists and reports incompatible historical contracts; its baseline and new-failure investigation are included, not silently ignored. Do not deploy the fixture public configuration used in screenshots.

## 3. Commit and push without the earlier branch error

Your earlier terminal was on `restore-auryn`, while `git push origin main` tried to push a different local branch. Run these from the existing checkout **after copying the ZIP source and preserving unrelated changes**. This creates a review branch from your current work; it does not overwrite remote main.

```bash
git status --short
git fetch origin
git switch -c auryn-ux-repair
git add -A
git add -f .github/workflows/auryn-v996-validation-queue.yml .github/workflows/nivora-calibration-mature.yml
git diff --cached --stat
git commit -m "Repair AURYN layouts, controls, quotes and research views"
git rebase origin/main
npm run verify:release
git push -u origin HEAD
```

If that branch already exists, use `git switch auryn-ux-repair`. If Git says there is nothing to commit, continue with fetch/rebase/verification. If rebase reports a conflict, resolve the named files, `git add` those files and `git rebase --continue`; use `git rebase --abort` to return to the pre-rebase state if needed. Do not choose all local or all remote files blindly. Do not force-push.

Open a pull request from `auryn-ux-repair` into `main`, review it, then merge. Vercel's Git integration deploys the merged main commit. If you intentionally want to update main directly after successful rebase and verification, the command is `git push origin HEAD:main`; a rejection means the remote moved, so fetch/rebase/test again.

```bash
git fetch origin
git log -1 --oneline
git rev-parse HEAD
git rev-parse origin/auryn-ux-repair
```

After the branch push, the last two hashes should match. After a PR merge, compare Vercel's deployed commit to `origin/main` (a merge/squash may have a different hash). Running npm commands does not update GitHub. An extracted ZIP is not a Git checkout: keep your existing `.git`, or clone the repository first and overlay `AURYN/` contents without nesting them.

## 4. Apply the database migration status

Use the existing Supabase project `culqkfmyqfpcuklonnog`. Review its migration history first; do not re-run the entire legacy schema.

The earlier handoff records that research-workspace and company-source-review migrations were applied and their tables have RLS enabled. The connected migration history records versions `20261016195707` and `20261016195621` respectively; local source filenames retain their original timestamps. Reconcile that mapping in your normal migration workflow before a broad CLI push.

The **paper-safety migration was still required at the last recorded inspection**. This UX repair did not recheck or modify the live database. An attempt returned connector error `Invalid or expired requestState`; a subsequent read confirmed its two new tables are absent. Its prerequisites are present. Apply that file using the SQL editor or your established migration workflow; it starts paper controls paused.

For a new environment, apply these **new files in order** using the Supabase SQL editor, or your established Supabase CLI migration workflow after reviewing `supabase migration list` and `supabase db push --dry-run`:

1. `supabase/migrations/20261016155025_auryn_paper_execution_safety.sql`
2. `supabase/migrations/20261016155712_auryn_research_workspace.sql`
3. `supabase/migrations/20261016161237_auryn_company_source_reviews.sql`

They depend on the existing application tables. The paper migration creates a paused control row. Source reviews and journal originals are append-only. Browser writes to execution and source-review audit tables are denied; authenticated workspace rows are owner-isolated. Isolated SQL tests verify these rules, but live deployment acceptance still requires testing your accounts.

## 5. Configure the existing Vercel project

In Vercel, keep repository `anudeepcare/nivora`, production branch `main`, Next.js preset, root containing `package.json`, install `npm ci`, build `npm run build`, and default Next.js output. Preserve existing environment values. Check public Supabase URL/key, server-only service role, Twelve Data/Finnhub/SEC configuration and the variables in `.env.example`. Environment edits require a new deployment. Do not expose server credentials in `NEXT_PUBLIC_` variables.

The Git integration can deploy a pushed main commit automatically. Confirm Vercel's deployment commit matches your pushed hash, inspect build/runtime logs, and exercise login, stock research, portfolio saves, watch reasons, source review and the Paper Lab. A successful build is not proof of configured providers or permissions.

## 6. Restore trusted administrator and paper operations

In your Supabase Auth dashboard, identify **your own** signed-in user UUID by matching the account you use. Set that UUID in Vercel's server-only `AURYN_ADMIN_USER_IDS` (comma-separated for multiple intended administrators), or use an existing trusted `app_metadata.role=admin` set through your admin tooling. Editable profile/user metadata does not grant access. Redeploy and confirm your account is allowed and an ordinary account is denied. No admin identity was guessed or modified in this build.

Set GitHub Actions secrets `AURYN_BASE_URL` to the actual HTTPS production origin and `CRON_SECRET` to the exact server secret configured in Vercel. The paper workflow accepts legacy names `AURYN_PRODUCTION_URL`/`TRADING_LAB_CRON_SECRET` as fallbacks, but the two workflows explicitly forced into Git above expect the current names. Never paste secret values into chat, commits or issue reports.

Review Paper Lab diagnostics. Verify the paper API keys refer to your **paper** account and set `TRADING_LAB_PAPER_ENABLED=true` only after the schema/configuration checks pass. Resume through the authenticated Lab control. Pause prevents new submissions; it does not cancel orders already held by Alpaca. Use the separate reconciliation control to inspect those orders.

Run a deliberate small paper-only preview/confirmation and inspect submission, acknowledgment, fill/rejection/cancellation, and reconciliation separately. No real paper order was sent during this build. The scheduler evaluates on its cron cadence; market-session and eligibility gates can legitimately skip a run. Recording trades does not automatically train/promote a new model.

## 7. Source reviews and valuation

Open a company → Business or Valuation → Source evidence review. Sign in, load current evidence, read the linked SEC disclosures and complete the source-backed review. Only a verified administrator can save. Changes to underlying evidence invalidate stale reviews. Review metadata does not manufacture missing financial amounts or unlock an unsupported specialist valuation method. The client refreshes company evidence and requests a fresh server-generated decision after saving.

## Rollback

Keep the prior production deployment/commit. If application acceptance fails, revert the release commit normally and push the revert, or use the existing Vercel rollback workflow. Do not drop new audit/journal tables or erase records as an application rollback. Keep paper paused while investigating.
