# AURYN — midnight source release

This archive contains the complete application source, package lock, migrations, workflows, tests, approved midnight concept and verification reports. It preserves the preceding intelligence and recovery work.

1. Read `RELEASE_REPORT.md` and `verification/midnight-release/VERIFICATION_REPORT.md` for current verification and unresolved items. Older reports describe earlier builds.
2. Follow `GIT_AND_VERCEL.md`. Copy the **contents** of `AURYN/` into your existing checkout, including `.github`; preserve `.git` and private `.env.local`. Do not create `AURYN/AURYN`.
3. Open `verification/midnight-release/visual-review/index.html` to compare the approved concept with real browser captures of this build. Preview prices and signals are illustrative; captured financial statements are dated source evidence, not live prices.
4. Run `npm ci` and `npm run verify:release` with your real environment. Dependencies and `.next` output are intentionally excluded; Vercel rebuilds the complete source.
5. Check migration status and administrator configuration before using Paper Lab. The paper-safety migration remains required; this build does not activate trading.

No source was pushed or deployed, no broker order was submitted, and no account role was changed in this release. Live environment, real-account preference sync, email delivery and paper execution require deployment acceptance. No physical iPhone/Safari certification is claimed. See `verification/next-build/REMAINING_GAPS.md` for unimplemented forward evidence and advanced portfolio history/exposure features.

`SOURCE_MANIFEST.json` hashes every delivered file except itself. Packaging verifies every archived byte and the tracked-source inventory. Credentials, `.git`, installed dependencies and caches are excluded. No new paid provider was added.
