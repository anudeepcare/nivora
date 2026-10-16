# AURYN — approved glass build

This archive contains the complete application source, package lock, migrations, workflows, tests, approved reference and verification reports. It includes the preceding intelligence and recovery work.

1. Read `RELEASE_REPORT.md` and `verification/glass-release/VERIFICATION_REPORT.md` for current results and limits. Older reports are historical.
2. Follow `GIT_AND_VERCEL.md`. Copy the **contents** of `AURYN/` into your existing checkout, including `.github`; preserve `.git` and private `.env.local`. Do not create a nested `AURYN/AURYN` folder.
3. Open `docs/design/approved-glass-2026-10-16/preview.html` for the approved interactive reference. Open `verification/glass-release/visual-review/index.html` for side-by-side comparisons with actual application captures.
4. Run `npm ci` and `npm run verify:release` with your real environment. The ZIP excludes installed dependencies and generated `.next` output; deployment rebuilds from the complete source.
5. Read the migration status in `GIT_AND_VERCEL.md` before deploying. The paper-safety migration remains required; this build does not activate automation.

No source was pushed or deployed, no broker order was submitted, and no account role was changed in this glass build. Live deployment, owner authorization, email delivery and paper execution require acceptance with the actual account. Previous read-only service checks are included and dated; browser fixtures do not certify live integrations.

`SOURCE_MANIFEST.json` hashes every delivered file except itself. The packager checks the archive against those hashes and the tracked source inventory. Private credentials, `.git`, caches and installed dependencies are intentionally excluded. No new paid data provider was added.
