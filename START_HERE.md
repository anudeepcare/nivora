# AURYN — product recovery source

This ZIP contains the complete application source, lockfile, tests, database migrations, workflows, approved design references and verification evidence. It includes the earlier intelligence upgrade and the latest recovery of research UX, financial metrics, chart state, Today/Discover and contribution planning.

1. Read `RELEASE_REPORT.md` for tested behavior and explicit remaining gaps.
2. Follow `GIT_AND_VERCEL.md`. Copy the contents of `AURYN/` into your existing checkout; preserve `.git` and private environment files. The instructions address your `restore-auryn` / non-fast-forward push problem.
3. Open `verification/product-recovery/visual-review/index.html` for current app captures and approved reference boards. Browser account/quote/decision data is synthetic; four company financial captures use saved real production responses.
4. Read `verification/product-recovery/connections.json` for read-only connection checks. Stock/crypto prices, Finnhub profile/logo, and an active Alpaca Paper account responded. Supabase research tables exist with RLS. Paper safety schema, owner authorization and deployed execution are not yet accepted.
5. `verification/next-build/requirements.json` retains the 104-item approved scope. `verification/next-build/REMAINING_GAPS.md` explains incomplete forward evidence, portfolio risk metadata and account benchmark histories. Missing source evidence is never replaced with invented metrics.
6. `SOURCE_MANIFEST.json` hashes every delivered file except itself. The packager verifies archive CRC, hashes and tracked source preservation.

The latest source has not been pushed or deployed. No orders were submitted and no account roles were changed. Two research migrations were applied; the paper migration remains pending. Old release reports are retained as historical context, not current certification. Start with this file and the current release report.
