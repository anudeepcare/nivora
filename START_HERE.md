# AURYN — cleanup review build

1. Open `verification/cleanup-2026-10-17/visual-review/index.html` to review the actual desktop/mobile build in both themes. The standalone `AURYN_Product_Review.html` provides the same review in one file.
2. Read `RELEASE_REPORT.md` and `verification/cleanup-2026-10-17/VERIFICATION_REPORT.md`. These supersede earlier UI release reports.
3. Read `GIT_AND_VERCEL.md` for installation, review-branch Git steps, configuration and deployment after approval. Preserve your `.git` and private `.env.local`; copy the contents of `AURYN/` without nesting another AURYN directory.
4. Run `npm ci`, then `npm run verify:release` with your own environment. No dependencies, `.next`, private credentials or Git history are packaged.
5. Consult `verification/next-build/REMAINING_GAPS.md` for the larger engine and production acceptance requirements. UI test success does not complete those requirements.

No push, deployment, database mutation, role grant or broker order was performed for this cleanup. The active global stylesheet is `app/ui.css`; historical CSS remains for provenance and is not imported. `SOURCE_MANIFEST.json` lists included source and hashes.
